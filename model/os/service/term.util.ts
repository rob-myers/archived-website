import { last } from '@model/generic.model';
import { Term, BinaryComposite, CompositeType } from '@model/os/term.model';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { ObservedType } from './term.service';
import { PipeComposite } from '@model/sh/composite/pipe.composite';
import { BinaryExecType } from '@model/sh/binary.model';
import { BashBinary } from '@model/sh/binary/bash.binary';
import { DoubleQuoteExpand } from '@model/sh/expand/double-quote.expand';
import { ExpandType } from '@model/sh/expand.model';
import { SingleQuoteExpand } from '@model/sh/expand/single-quote.expand';
import { SimpleComposite } from '@model/sh/composite/simple.composite';

export class TermError extends Error {
  constructor(
    message: string,
    public exitCode: number,
    public internalCode?: 'P_EXIST' | 'PP_NO_EXIST' | 'F_NO_EXIST' | 'NOT_A_DIR',
  ) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, TermError.prototype);
  }
}

/**
 * Wrap term iteration, handling 'exit' and thrown errors.
 * _TODO_ Move elsewhere.
 */
export async function* iterateTerm(
  { term, dispatch, processKey }: {
    term: Term;
    dispatch: OsDispatchOverload;
    processKey: string;
  }): AsyncIterableIterator<ObservedType> {

  const iterator = term.semantics(dispatch, processKey);
  let done = false, act: ObservedType;
  let yielded: undefined | boolean = undefined;

  /**
   * Enter the term.
   */
  yield { key: 'enter', term };

  try {
    //@ts-ignore
    while (({ done, value: act } = await iterator.next(yielded)) && !done) {
      /**
       * Propagate action, eventually to {osStartProcessThunk}.
       * Also propagate yielded value, to detect 'read' eof.
       */
      yielded = yield act;
      if (act && act.key === 'exit' && term === act.term) {
        return; // Skip subsequent actions of term we just exited.
      }
    }
    /**
     * Exit the term, if we haven't already.
     * TODO avoid exiting twice.
     */
    yield { key: 'exit', term, code: term.exitCode || 0 };

  } catch (e) {
    /**
     * Handle errors thrown e.g. in dispatched action.
     */
    if (e instanceof TermError) {
      console.log(`error: ${e.message}`);
      console.error(e);
      yield { key: 'exit', term, code: e.exitCode, line: e.message };
    } else {
      const line = `unexpected error in term '${term.key}'`;
      console.log({ error: line, term });
      console.error(e);
      yield { key: 'exit', term, code: 2, line };
    }
  }
}

export function normalizeWhitespace(word: string, trim = true): string[] {
  if (!word.trim()) {
    return [];// Forbid output [''].
  }
  if (trim) {
    return word.trim().replace(/[\s]+/g, ' ').split(' ');
  }
  // Must preserve single leading/trailing space.
  const words = word.replace(/[\s]+/g, ' ').split(' ');
  if (!words[0]) {// ['', 'foo'] -> [' foo']
    words.shift();
    words[0] = ' ' + words[0];
  }
  if (!last(words)) {// ['foo', ''] -> ['foo ']
    words.pop();
    words.push(words.pop() + ' ');
  }
  return words;
}

/**
 * Given interactive input to shell, interpret escape sequences.
 * _TODO_ Refactor as single pass of string?
 */
export function interpretEscapeSequences(input: string): string {
  const value = JSON.stringify(input)
    // Unicode utf-16 e.g. '\\\\u001b' -> '\\u001b'.
    .replace(/\\\\u([0-9a-f]{4})/g, '\\u$1')
    // Replace double backslashes by their unicode.
    .replace(/\\\\\\\\/g, '\\u005c')
    // '\\\\e' -> '\\u001b'.
    .replace(/\\\\e/g, '\\u001b')
    // Hex escape-code (0-255) e.g. '\\\\x1b' -> '\\u001b'.
    .replace(/\\\\x([0-9a-f]{2})/g, '\\u00$1')
    // e.g. '\\\\n' -> '\\n'.
    .replace(/\\\\([bfnrt])/g, '\\$1')
    // Vertical tab '\\\\v' -> '\u000b'
    .replace(/\\\\v/g, '\\u000b')
    // Alert/Bell '\\\\a' -> '\u0007'
    .replace(/\\\\a/g, '\\u0007')
    // Octal escape-code (0-255) e.g. '\\\\047' -> '\\u0027'.
    // - Out-of-bounds become `?`.
    .replace(/\\\\([0-7]{3})/g,
      (_, submatch) => {
        const decimal = parseInt(submatch, 8);
        return decimal < 256
          ? `\\u00${decimal.toString(16)}`
          : '?';
      });

  return JSON.parse(value) as string;
}

export function validateRegexString(
  input: string,
  badSuffix = ''
): boolean {
  try {
    return Boolean(new RegExp(input));
  } catch (e) {
    // Fail iff error message has bad suffix.
    return !(e.message as string).endsWith(badSuffix);
  }
}

/**
 * Was {term} launched interactively?
 * Holds iff have interactive bash as ancestor with
 * no intermediate bash, binary or pipe.
 */
export function launchedInteractively(term: Term): boolean {
  /**
   * Most recent binary/pipe ancestor, if any.
   */
  const found = findAncestralTerm(term,
    (ancestor): ancestor is BinaryComposite | PipeComposite =>
      ancestor.key === CompositeType.binary || ancestor.key === CompositeType.pipe,
  );
  return found ? isInteractiveShell(found) : false;
}

/**
 * Find first ancestor satisfying {predicate},
 * returning null if n'exist pas.
 */
export function findAncestralTerm<T extends Term = Term>(
  term: Term,
  predicate: (ancestor: Term) => ancestor is T,
): null | T {
  let parent: null | Term = term;
  // eslint-disable-next-line no-cond-assign
  while (parent = parent.parent) {
    if (predicate(parent)) {
      return parent;
    }
  }
  return null;
}

export function isInteractiveShell(term: Term): boolean {
  return term.key === CompositeType.binary
    && term.binaryKey === BinaryExecType.bash
    && term.interactive;
}

export function isBash(term: Term): term is BashBinary {
  return term.key === CompositeType.binary && term.binaryKey === BinaryExecType.bash;
}

export function isDoubleQuote(term: Term): term is DoubleQuoteExpand {
  return term.key === CompositeType.expand && term.expandKey === ExpandType.doubleQuote;
}

export function isSingleQuote(term: Term): term is SingleQuoteExpand {
  return term.key === CompositeType.expand && term.expandKey === ExpandType.singleQuote;
}

export function isBackgroundTerm(term: Term) {
  return term.key === CompositeType.simple && term.def.background
    || term.key === CompositeType.compound && term.def.background;
}

/** Note `FunctionComposite` used for _declaration_ not _invocation_. */
export function insideInvokedFunction(term: Term): boolean {
  return findAncestralTerm(term, (ancestor): ancestor is SimpleComposite =>
    ancestor.key === CompositeType.simple
      && (ancestor.method && ancestor.method.key === 'invoke-function')
      || false
  ) !== null;
}