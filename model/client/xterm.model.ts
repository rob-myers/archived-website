import { XtermClient } from '@model/client/xterm.client';

/**
 * Maximum lines we can scrollback in xterm.
 * We'll also use this to limit the printed lines.
 */
export const xtermScrollbackMaxLines = 500;

export interface XTermState {
  key: string;
  uiKey: string;
  userKey: string;
  sessionKey: string;
  ttyXterm: XtermClient;
}

export function createXTermState(init: XTermState): XTermState {
  return { ...init };
}

export function computeXtermKey(uiKey: string, sessionKey: string) {
  return `${uiKey}@${sessionKey}`;
}
