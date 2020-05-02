import * as BABYLON from 'babylonjs';
import { createAct, ActionsUnion, addToLookup, updateLookup, removeFromLookup, Redacted, redact } from '@model/redux.model';
import { createThunk } from '@model/root.redux.model';
import { testNever, KeyedLookup } from '@model/generic.model';
import { LevelState, createLevelState, LevelStateInit } from '@model/level/level.model';
import { createDemoScene } from '@model/level/babylon.model';

export interface State {
  instance: KeyedLookup<LevelState>;
}

const initialState: State = {
  instance: {},
};

export const Act = {
  registerLevel: (uid: string, init: LevelStateInit) =>
    createAct('[Level] register level', { uid, ...init }),
  updateLevel: (uid: string, updates: Partial<LevelState>) =>
    createAct('[Level] update level', { uid, updates }),
  unregisterLevel: (uid: string) =>
    createAct('[Level] unregister level', { uid }),
};

export type Action = ActionsUnion<typeof Act>;

export const Thunk = {
  createLevel: createThunk(
    '[Level] create',
    async ({ dispatch }, { uid, canvas }: {
      uid: string;
      canvas: Redacted<HTMLCanvasElement>;
    }) => {
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
      });
      const scene = createDemoScene(canvas, engine);
      // Start rendering
      engine.runRenderLoop(() => scene.render());

      dispatch(Act.registerLevel(uid, {
        canvas,
        engine: redact(engine),
        scene: redact(scene),
      }));
    },
  ),
  destroyLevel: createThunk(
    '[Level] destroy',
    async ({ dispatch, state: { level } }, { uid }: { uid: string }) => {
      const { engine, scene } = level.instance[uid];
      engine.stopRenderLoop();
      scene.dispose();
      dispatch(Act.unregisterLevel(uid));
    },
  ),
};

export type Thunk = ActionsUnion<typeof Thunk>;

export const reducer = (state = initialState, act: Action): State => {
  switch (act.type) {
    case '[Level] register level': return {...state,
      instance: addToLookup(createLevelState(act.pay.uid, act.pay), state.instance),
    };
    case '[Level] update level': return { ...state,
      instance: updateLookup(act.pay.uid, state.instance, () => act.pay.updates),
    };
    case '[Level] unregister level': return { ...state,
      instance: removeFromLookup(act.pay.uid, state.instance),
    };
    default: return state || testNever(act);
  }
};
