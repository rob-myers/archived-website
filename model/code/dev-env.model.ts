import { CyclicDepError, UntranspiledPathInterval, JsExportMeta, JsImportMeta } from './patch-js-imports';
import { KeyedLookup, lookupFromValues } from '@model/generic.model';
import { ScssImportPathInterval } from '@worker/syntax/analyze.model';

export const menuHeightPx = 32;

const supportedFileMetas = [
  { filenameExt: '.tsx', panelKeyPrefix: 'tsx' },
  { filenameExt: '.scss', panelKeyPrefix: 'scss'},
  { filenameExt: '.ts', panelKeyPrefix: 'ts'},
];

export function hasSupportedExtension(filename: string) {
  return supportedFileMetas.some(({ filenameExt }) => filename.endsWith(filenameExt));
}

export function isFilePanel(panelKey: string, filename?: string) {
  return supportedFileMetas.some(({ filenameExt, panelKeyPrefix }) =>
    panelKey.startsWith(panelKeyPrefix) && filename?.endsWith(filenameExt));
}

export function isAppPanel(panelKey: string) {
  return /^app(-|$)/.test(panelKey);
}

export function panelKeyToAppElId(panelKey: string) {
  return `app-render-root-${panelKey}`;
}

export function panelKeyToAppScriptId(panelKey: string) {
  return `bootstrap-app-${panelKey}`;
}

export function panelKeyToEditorKey(panelKey: string) {
  return `editor-${panelKey}`;
}

export function filenameToModelKey(filename: string) {
  return `model-${filename}`;
}

export function filenameToScriptId(filename: string) {
  return `esm-script-${filename}`;
}

export function appendEsmModule(input: { scriptId: string; scriptSrcUrl: string }) {
  document.getElementById(input.scriptId)?.remove();
  const el = document.createElement('script');
  el.id = input.scriptId;
  el.setAttribute('type', 'module');
  el.src = input.scriptSrcUrl;
  document.head.appendChild(el);
}

export type FileState = (
  | CodeFile
  | StyleFile
);

export interface TranspiledCodeFile extends CodeFile {
  transpiled: CodeTranspilation;
}

export interface CodeFile extends BaseFile {
  /** Filename extension (suffix of `key`) */
  ext: 'tsx' | 'ts';
  /**
   * Code intervals in untranspiled code used to indicate errors.
   * They are the paths specified in an import or export.
   */
  pathIntervals: UntranspiledPathInterval[];
  /** Last transpilation */
  transpiled: null | CodeTranspilation;
  /** es module */
  esm: null | CodeFileEsm;
}

export interface StyleFile extends BaseFile {
  ext: 'scss';
  prefixed: null | {
    src: string;
    /** Contents with classes prefixed by filename */
    dst: string;
    /** @import path intervals in `prefixedContents` */
    importIntervals: ScssImportPathInterval[];
  };
  /** Last transpilation */
  transpiled: null | StyleTranspilation;
}

interface BaseFile {
  /** Filename */
  key: string;
  /** Debounced value (doesn't drive editor) */
  contents: string;
  /** Can dispose model code/transpile trackers */
  cleanupTrackers: (() => void)[];
}

export type Transpilation = (
  | CodeTranspilation
  | StyleTranspilation
);

export interface CodeTranspilation extends BaseTranspilation {
  type: 'js';
  exports: JsExportMeta[];
  imports: JsImportMeta[];
  /** Is there a cyclic dependency in transpiled code? */
  cyclicDepError: null | CyclicDepError;
  typings: string;
  importFilenames: string[];
  exportFilenames: string[];
}

export interface StyleTranspilation extends BaseTranspilation {
  type: 'css';
}

interface BaseTranspilation {
  /** Untranspiled code */
  src: string;
  /** Transpiled code */
  dst: string;
  /** e.g. remove previous typings (js only) */
  cleanups: (() => void)[];
}

export interface CodeFileEsm {
  /**
   * Actual code inside <script> i.e. `transpiled.dst`
   * with import specifiers replaced by blob urls.
   */
  patchedCode: string;
  blobUrl: string;
}

export function isFileValid(file: FileState) {
  return file.ext === 'scss' || (
    file.transpiled?.type === 'js'
    && !file.transpiled.cyclicDepError
    && file.transpiled.src === file.contents
  );
}

/** Get ts/tsx files reachable from index.tsx */
export function getReachableJsFiles(file: KeyedLookup<FileState>) {
  const frontier = [file['index.tsx']] as CodeFile[];
  const reachable = lookupFromValues(frontier);
  while (frontier.length) {
    const prevFrontier = frontier.slice();
    frontier.length = 0;
    prevFrontier.forEach((node) => {
      const newAdjs = (node.transpiled?.importFilenames || [])
        .filter(filename => !(filename in reachable))
        .map(filename => file[filename] as CodeFile);
      frontier.push(...newAdjs);
      newAdjs.forEach(f => reachable[f.key] = f);
    });
  }
  return Object.values(reachable);
}
