import * as sprintfJs from 'sprintf-js';
import { BaseBuiltinComposite } from './base-builtin';
import { BuiltinOtherType } from '../builtin.model';
import { ObservedType } from '@os-service/term.service';
import { interpretEscapeSequences } from '@model/os/service/term.util';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osAssignVarThunk } from '@store/os/declare.os.duck';

export class PrintfBuiltin extends BaseBuiltinComposite<
  BuiltinOtherType.printf,
  { string: 'v'[]; boolean: never[] }
> {

  public specOpts() {
    return { string: ['v'] as 'v'[], boolean: [] };
  }

  public async *semantics(
    dispatch: OsDispatchOverload,
    processKey: string,
  ): AsyncIterableIterator<ObservedType> {
    const { operands: [format, ...args], opts } = this;

    if (this.malformedOpts || (opts.v && !format)) {
      yield this.exit(1, 'usage: printf [-v var] format [arguments]');
    }

    if (format) {
      try {
        const output = sprintfJs.sprintf(format, ...args);
        if (opts.v) {
          const value = interpretEscapeSequences(output);
          dispatch(osAssignVarThunk({ varName: opts.v, act: { key: 'default', value }, processKey }));
        } else {
          const buffer = interpretEscapeSequences(output).split('\n');
          yield this.write(buffer, 1);
        }
      } catch (e) {
        const errMsg = `${e}`.replace('SyntaxError: [sprintf] ', '');
        console.error(e);
        yield this.exit(1, errMsg);
      }
    }

    yield this.exit(0);
  }

}
