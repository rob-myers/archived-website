import { createAct, ActionsUnion, createThunk } from './redux-util';
import { KeyedLookup } from '@custom-types/generic.model';

export interface State {
  dom: KeyedLookup<string, {
    key: string;
    /** For throttling (epoch ms). */
    nextUpdate: null | number;
  }>;
}

type NavDomState = State['dom'][0];


const initialState: State = {
  dom: {},
};

function createNavDomState(uid: string): NavDomState {
  return {
    key: uid,
    nextUpdate: null,
  };
}

const Act = {
  registerNavDom: (uid: string) =>
    createAct('REGISTER_NAV_DOM', { uid }),
  setThrottle: (uid: string, waitMs: number) =>
    createAct('THROTTLE_NAV_DOM', { uid, waitMs }),
};

export type Action = ActionsUnion<typeof Act>;

const Thunk = {
  computeNavigable: createThunk(
    'COMPUTE_NAVIGABLE_THUNK',
    (_, _uid: string) => {
      // ...
    },
  ),
  updateNavigable: createThunk(
    'UPDATE_NAVIGABLE_THUNK',
    ({ dispatch, getState }, uid: string) => {
  
      const state = getState().nav.dom[uid];
      if (!state || state.nextUpdate) {
        return; // Not found or throttled.
      }
  
      const waitMs = 100;
      dispatch(Act.setThrottle(uid, Date.now() + waitMs));
      window.setTimeout(() => dispatch(Thunk.computeNavigable(uid)), waitMs);
    },
  )
};

export type Thunk = ActionsUnion<typeof Thunk>;

export const reducer = (state = initialState, act: Action): State => {
  switch (act.type) {
    case 'REGISTER_NAV_DOM': return { ...state,
      dom: { ...state.dom, [act.uid]: createNavDomState(act.uid) }
    };
    /**
     * TODO utils to simplify {lookup} create/update.
     */
    case 'THROTTLE_NAV_DOM': return { ...state,
      dom: { ...state.dom, /** TODO */ }
    };
    default: return state;
  }
};

export default Act;
