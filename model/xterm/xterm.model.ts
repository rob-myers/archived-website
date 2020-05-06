import { TtyXterm } from '@model/xterm/tty.xterm';

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
  ttyXterm: TtyXterm;
}

export function createXTermState(init: XTermState): XTermState {
  return { ...init };
}

export function computeXtermKey(uiKey: string, sessionKey: string) {
  return `${uiKey}@${sessionKey}`;
}
