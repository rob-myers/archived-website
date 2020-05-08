import { createAct, ActionsUnion, addToLookup, removeFromLookup, Redacted, redact } from '../model/redux.model';
import { KeyedLookup } from '@model/generic.model';
import { XTermState, createXTermState, computeXtermKey } from '@model/client/xterm.model';
import { createThunk } from '@model/root.redux.model';
import { OsWorker, awaitWorker } from '@model/os/os.worker.model';

import OsWorkerClass from '@worker/os/os.worker';
import { XtermClient } from '../model/client/xterm.client';
import { Terminal } from 'xterm';
import { VoiceClient } from '@model/client/voice.client';

export interface State {
  instance: KeyedLookup<XTermState>;
  worker: null | Redacted<OsWorker>;
  voice: null | VoiceClient;
  /** Is the operating system ready in the worker? */
  status: 'initial' | 'pending' | 'ready' | 'failed';
}

const initialState: State = {
  instance: {},
  worker: null,
  voice: null,
  status: 'initial',
};

export const Act = {
  registerInstance: (def: XTermState) =>
    createAct('[xterm] register', def),
  setStatus: (status: State['status']) =>
    createAct('[xterm] set status', { status }),
  storeWorker: ({ worker, voice }: {
    worker: Redacted<OsWorker>;
    voice: Redacted<VoiceClient>;
  }) => createAct('[xterm] store worker', { worker, voice }),
  unregisterInstance: (key: string) =>
    createAct('[xterm] unregister', { key }),
};

export type Action = ActionsUnion<typeof Act>;

export const Thunk = {
  ensureGlobalSetup: createThunk(
    '[xterm] ensure setup',
    async ({ dispatch, state: { xterm } }) => {
      if (typeof Worker === 'undefined') {
        dispatch(Act.setStatus('failed'));
      }
      switch (xterm.status) {
        case 'failed': {
          throw Error('web worker required');
        }
        case 'initial': {
          dispatch(Act.setStatus('pending'));
          /** One worker for operating system */
          const worker = redact(new OsWorkerClass);
          /** One instance of voice (only one-voice-at-a-time possible) */
          const voice = redact(new VoiceClient({ osWorker: worker }));
          voice.initialise();
          dispatch(Act.storeWorker({ voice, worker }));
          
          // Wait for operating system to be ready
          await awaitWorker('worker-os-ready', worker);
          dispatch(Act.setStatus('ready'));
          return worker;
        }
        case 'pending': {
          const worker = xterm.worker!;
          await awaitWorker('worker-os-ready', worker);
          return worker;
        }
        case 'ready': {
          return xterm.worker!;
        }
      }
    },
  ),
  createSession: createThunk(
    '[xterm] create session',
    async (
      { dispatch },
      { uiKey, userKey, xterm, onCreate, env }: {
        uiKey: string;
        userKey: string;
        xterm: Redacted<Terminal>;
        env: Record<string, string>;
        onCreate: (sessionKey: string) => void;
      }
    ) => {
      // Wait for worker to be ready
      const worker = await dispatch(Thunk.ensureGlobalSetup({}));

      // Create session in os worker
      worker.postMessage({ key: 'create-session', uiKey, userKey, env });
      const msg = await awaitWorker('created-session', worker, (msg) => msg.uiKey === uiKey);

      // Create TtyXterm, initialise and register
      const ttyXterm = new XtermClient({
        canonicalPath: msg.canonicalPath,
        sessionKey: msg.sessionKey,
        linesPerUpdate: 10000,
        refreshMs: 1,
        osWorker: worker,
        uiKey,
        xterm,
      });
      ttyXterm.initialise();

      dispatch(Act.registerInstance({
        key: computeXtermKey(uiKey, msg.sessionKey),
        sessionKey: msg.sessionKey,
        ttyXterm,
        uiKey,
        userKey,
      }));
      onCreate(msg.sessionKey); // Inform Session component
    },
  ),
  endSession: createThunk(
    '[xterm] end session',
    ({ dispatch, state: { xterm: { instance } }  }, { xtermKey }: { xtermKey: string }) => {
      const state = instance[xtermKey];
      if (state) {
        state.ttyXterm.dispose();
        dispatch(Act.unregisterInstance(state.key));
      }
    },
  ),
  saveOs: createThunk(
    '[xterm] save operating system',
    ({ state: { xterm: { worker } } }) => {
      worker?.postMessage({ key: 'save-os' });
    },
  ),
};

export type Thunk = ActionsUnion<typeof Thunk>;

export const reducer = (state = initialState, act: Action): State => {
  switch (act.type) {
    case '[xterm] register': return { ...state,
      instance: addToLookup(createXTermState(act.pay), state.instance),
    };
    case '[xterm] set status': return { ...state,
      status: act.pay.status,
    };
    case '[xterm] store worker': return { ...state,
      worker: act.pay.worker,
      voice: act.pay.voice,
    };
    case '[xterm] unregister': return { ...state,
      instance: removeFromLookup(act.pay.key, state.instance),
    };
    default: return state;
  }
};
