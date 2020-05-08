import * as BABYLON from 'babylonjs';
import { createAct, ActionsUnion, addToLookup, updateLookup, removeFromLookup, Redacted, redact } from '@model/redux.model';
import { createThunk } from '@model/root.redux.model';
import { testNever, KeyedLookup } from '@model/generic.model';
import { LevelState, createLevelState, LevelStateInit, LevelOptionCommand } from '@model/level/level.model';
import { babylonEngineParams, loadInitialScene, createTile, createWall } from '@model/level/babylon.model';
import { OsWorker } from '@model/os/os.worker.model';
import { LevelClient } from '@model/client/level.client';
import { Poly2 } from '@model/poly2.model';
import { Rect2 } from '@model/rect2.model';
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
      const { tiles, walls } = level.instance[levelKey];
      const updates = {} as Partial<LevelState>;
      if (what === 'tiles' || what === 'all') {
        Object.keys(tiles).forEach(key => tiles[key].dispose());
        updates.tiles = {};
      }
      if (what === 'walls' || what === 'all') {
        Object.keys(walls).forEach(key => walls[key].dispose());
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
            case 'clear': {
              dispatch(Thunk.clear({ levelKey: uid, what: cmd.what }));
              break;
            }
            case 'set-tiles': {
              const [ox, oy] = cmd.offset;
              dispatch(Thunk.setTiles({
                levelKey: uid,
                enabled: cmd.enabled,
                tiles: cmd.tiles.map(([x, y]) => ({
                  x: x + ox,
                  y: y + oy,
                  key: `${x + ox},${y + oy}`,
                })),
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
      const { scene, tiles: prev, tilePolys, extWalls } = level.instance[levelKey];
      const [next, rects] = [{ ...prev }, [] as Rect2[]];
      
      for (const { key, x, y } of tiles) {
        rects.push(new Rect2(x, y, 1, 1));
        if (enabled && !next[key]) {
          next[key] = redact(createTile(x, y, scene));
        } else if (!enabled && next[key]) {
          next[key].dispose();
          delete next[key];
        }
      }

      const polys = enabled
        ? Poly2.union(rects.map(x => x.poly2).concat(tilePolys))
        : Poly2.cutOut(rects.map(x => x.poly2), tilePolys);

      extWalls.forEach(wall => wall.dispose());

      dispatch(Act.updateLevel(levelKey, {
        tiles: next,
        tilePolys: polys.map(x => redact(x)),
        extWalls: polys.flatMap(x => x.lineSegs)
          .map(([u, v]) => redact(createWall(u, v, scene))),
      }));
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
