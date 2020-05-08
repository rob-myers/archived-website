import * as BABYLON from 'babylonjs';
import { createAct, ActionsUnion, addToLookup, updateLookup, removeFromLookup, Redacted, redact } from '@model/redux.model';
import { createThunk } from '@model/root.redux.model';
import { testNever, KeyedLookup } from '@model/generic.model';
import { LevelState, createLevelState, LevelStateInit, LevelOptionCommand } from '@model/level/level.model';
import { babylonEngineParams, loadInitialScene, createTile } from '@model/level/babylon.model';
import { OsWorker } from '@model/os/os.worker.model';
import { LevelClient } from '@model/client/level.client';
import { ExternalLevelCmd } from './inode/level.inode';

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
  clear: createThunk(
    '[Level] clear',
    ({ dispatch, state: { level } }, { levelKey, what }: {
      levelKey: string;
      what: 'tiles' | 'walls' | 'all';
    }) => {
      const { tiles, walls, scene } = level.instance[levelKey];
      const updates = {} as Partial<LevelState>;
      if (what === 'tiles' || what === 'all') {
        Object.keys(tiles).forEach(key => scene.removeMesh(tiles[key]));
        updates.tiles = {};
      }
      if (what === 'walls' || what === 'all') {
        Object.keys(walls).forEach(key => scene.removeMesh(walls[key]));
        updates.walls = {};
      }
      dispatch(Act.updateLevel(levelKey, updates));
    },
  ),
  createLevel: createThunk(
    '[Level] create',
    async ({ dispatch, state: { level } }, { uid, canvas, osWorker }: {
      uid: string;
      canvas: Redacted<HTMLCanvasElement>;
      osWorker: Redacted<OsWorker>;
    }) => {
      if (level.instance[uid]) {// Avoid duplicate engines
        dispatch(Thunk.destroyLevel({ uid }));
      }
      const engine = new BABYLON.Engine(canvas, true, babylonEngineParams);
      const scene = loadInitialScene(engine, canvas);

      const levelClient = new LevelClient({
        osWorker,
        levelKey: uid,
        // Execute a command originally sent from corresponding LevelINode
        runCommand: (cmd: ExternalLevelCmd) => {
          switch (cmd.key) {
            case 'clear': dispatch(Thunk.clear({ levelKey: uid, what: cmd.what })); break;
            case 'set-tiles': {
              dispatch(Thunk.setTiles({ levelKey: uid, enabled: cmd.enabled,
                tiles: cmd.tiles.map(([x, y]) => ({ x, y, key: `${x},${y}` })),
              }));
              break;
            }
          }
        },
      });
      levelClient.initialise();

      dispatch(Act.registerLevel(uid, {
        canvas,
        engine: redact(engine),
        scene: redact(scene),
        client: redact(levelClient),
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
  ),
  setTiles: createThunk(
    '[Level] set tiles',
    ({ state: { level }, dispatch }, { levelKey, tiles, enabled }: {
      levelKey: string;
      tiles: { key: string; x: number; y: number }[];
      enabled: boolean;
    }) => {
      const { scene, tiles: prev } = level.instance[levelKey];
      const next = { ...prev };
      for (const { key, x, y } of tiles) {
        if (enabled && !next[key]) {
          next[key] = createTile(x, y, scene);
        } else if (!enabled && next[key]) {
          scene.removeMesh(next[key]);
          delete next[key];
        }
      }
      dispatch(Act.updateLevel(levelKey, { tiles: next }));
    },
  ),
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
