import { createAct, ActionsUnion, Redacted, redact } from '@model/redux.model';
import { LevelWorker, awaitWorker } from '@model/level/level.worker.model';
import { createThunk } from '@model/root.redux.model';

import LevelWorkerClass from '@worker/level/level.worker';
import { testNever } from '@model/generic.model';

export interface State {
  worker: null | Redacted<LevelWorker>;
  /** Status of web worker */
  status: 'initial' | 'pending' | 'ready' | 'failed';
}

const initialState: State = {
  worker: null,
  status: 'initial',
};

export const Act = {
  setStatus: (status: State['status']) =>
    createAct('[Level] set status', { status }),
  storeWorker: (worker: Redacted<LevelWorker>) =>
    createAct('[Level] store worker', { worker }),
};

export type Action = ActionsUnion<typeof Act>;

export const Thunk = {
  createLevel: createThunk(
    '[Level] create',
    async ({ dispatch }, { uid }: { uid: string }) => {
      const worker = await dispatch(Thunk.ensureWorker({}));
      worker.postMessage({ key: 'request-new-level', levelUid: uid });
      await awaitWorker('worker-created-level', worker);
    },
  ),
  destroyLevel: createThunk(
    '[Level] destroy',
    async ({ dispatch }, { uid }: { uid: string }) => {
      const worker = await dispatch(Thunk.ensureWorker({}));
      worker.postMessage({ key: 'request-destroy-level', levelUid: uid });
    },
  ),
  ensureWorker: createThunk(
    '[Level] ensure worker',
    async ({ dispatch, state: { level } }) => {
      if (typeof Worker === 'undefined') {
        dispatch(Act.setStatus('failed'));
      }
      switch (level.status) {
        case 'failed': {
          throw Error('web worker required');
        }
        case 'initial': {
          dispatch(Act.setStatus('pending'));
          const worker = new LevelWorkerClass();
          dispatch(Act.storeWorker(redact(worker)));
          await awaitWorker('level-worker-ready', worker);
          dispatch(Act.setStatus('ready'));
          return worker;
        }
        case 'pending': {
          const worker = level.worker!;
          await awaitWorker('level-worker-ready', worker);
          return worker;
        }
        case 'ready': {
          return level.worker!;
        }
      }
    },
  ),
};

export type Thunk = ActionsUnion<typeof Thunk>;

export const reducer = (state = initialState, act: Action): State => {
  switch (act.type) {
    case '[Level] set status': return { ...state,
      status: act.pay.status,
    };
    case '[Level] store worker': return { ...state,
      worker: act.pay.worker,
    };
    default: return state || testNever(act);
  }
};
