import * as BABYLON from 'babylonjs';
import { createAct, ActionsUnion, addToLookup, updateLookup, removeFromLookup, Redacted, redact } from '@model/redux.model';
import { createThunk } from '@model/root.redux.model';
import { testNever, KeyedLookup } from '@model/generic.model';
import { LevelState, createLevelState, LevelStateInit, LevelOptionCommand } from '@model/level/level.model';
import { createDemoScene, loadObjIntoScene as loadGtlfIntoScene } from '@model/level/babylon.model';

export interface State {
  instance: KeyedLookup<LevelState>;
}

const initialState: State = {
  instance: {},
};

export const Act = {
  registerLevel: (uid: string, init: LevelStateInit) =>
    createAct('[Level] register', { uid, ...init }),
  updateLevel: (uid: string, updates: Partial<LevelState>) =>
    createAct('[Level] update', { uid, updates }),
  unregisterLevel: (uid: string) =>
    createAct('[Level] unregister', { uid }),
};

export type Action = ActionsUnion<typeof Act>;

export const Thunk = {
  addCuboid: createThunk(
    '[Level] add mesh',
    ({ state: { level } }, { levelUid, meshName, bounds, position }: {
      levelUid: string;
      meshName: string;
      bounds: BABYLON.Vector3;
      position: BABYLON.Vector3;
    }) => {
      const { scene } = level.instance[levelUid];
      const mesh = BABYLON.MeshBuilder.CreateBox(meshName, {
        width: bounds.x,
        height: bounds.y,
        depth: bounds.z,
      }, scene);
      mesh.position = position;
    },
  ),
  createLevel: createThunk(
    '[Level] create',
    async ({ dispatch, state: { level } }, { uid, canvas }: {
      uid: string;
      canvas: Redacted<HTMLCanvasElement>;
    }) => {
      if (level.instance[uid]) {// Avoid duplicate engines
        dispatch(Thunk.destroyLevel({ uid }));
      }
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      const scene = createDemoScene(canvas, engine);
      await loadGtlfIntoScene(scene);
      dispatch(Act.registerLevel(uid, {
        canvas,
        engine: redact(engine),
        scene: redact(scene),
      }));
      dispatch(Thunk.setLevelOption({ key: 'render', uid, shouldRender: true }));
    },
  ),
  destroyLevel: createThunk(
    '[Level] destroy',
    ({ dispatch, state: { level } }, { uid }: { uid: string }) => {
      if (level.instance[uid]) {
        dispatch(Thunk.setLevelOption({ key: 'render', uid, shouldRender: false }));
        level.instance[uid].scene.dispose();
        dispatch(Act.unregisterLevel(uid));
      }
    },
  ),
  removeMesh: createThunk(
    '[Level] remove mesh',
    ({ state: { level } }, { levelUid, meshName }: { levelUid: string; meshName: string }) => {
      const { scene } = level.instance[levelUid];
      scene.getMeshByName(meshName)?.dispose();
    },
  ),
  setLevelOption: createThunk(
    '[Level] set option',
    ({ state: { level }, dispatch }, cmd: LevelOptionCommand) => {
      if (!level.instance[cmd.uid]) {
        return;
      }
      const { engine, scene, rendering } = level.instance[cmd.uid];
      switch (cmd.key) {
        case 'render': {
          cmd.shouldRender && !rendering && engine.runRenderLoop(() => scene.render());
          !cmd.shouldRender && engine.stopRenderLoop();
          dispatch(Act.updateLevel(cmd.uid, { rendering: cmd.shouldRender }));
          break;
        }
      }
    },
  )
};

export type Thunk = ActionsUnion<typeof Thunk>;

export const reducer = (state = initialState, act: Action): State => {
  switch (act.type) {
    case '[Level] register': return {...state,
      instance: addToLookup(createLevelState(act.pay.uid, act.pay), state.instance),
    };
    case '[Level] update': return { ...state,
      instance: updateLookup(act.pay.uid, state.instance, () => act.pay.updates),
    };
    case '[Level] unregister': return { ...state,
      instance: removeFromLookup(act.pay.uid, state.instance),
    };
    default: return state || testNever(act);
  }
};
