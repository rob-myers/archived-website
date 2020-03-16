import { persistStore } from 'redux-persist';
import { fromEvent } from 'rxjs';
import { filter, map, delay, auditTime } from 'rxjs/operators';

import { LevelWorkerContext, LevelWorker, MessageFromLevelParent, ToggleLevelTile, ToggleLevelWall } from '@model/level/level.worker.model';
import { LevelDispatchOverload } from '@model/level/level.redux.model';
import { Act } from '@store/level/level.worker.duck';
import { Message } from '@model/worker.model';
import { redact, removeFromLookup } from '@model/redux.model';
import { LevelState, floorInset, smallTileDim, tileDim } from '@model/level/level.model';
import { Poly2 } from '@model/poly2.model';
import { Rect2 } from '@model/rect2.model';
import { NavGraph } from '@model/nav/nav-graph.model';
import { Vector2 } from '@model/vec2.model';
import { LevelMeta } from '@model/level/level-meta.model';
import { initializeStore } from './create-store';

const ctxt: LevelWorkerContext = self as any;

const store = initializeStore(ctxt);
const dispatch = store.dispatch as LevelDispatchOverload;
const persistor = persistStore(store as any, null, () => {
  ctxt.postMessage({ key: 'level-worker-ready' });
});
persistor.pause(); // We save manually

const getLevel = (levelUid: string): LevelState | undefined =>
  store.getState().level.instance[levelUid];

/**
 * Worker message handler.
 */
ctxt.addEventListener('message', async ({ data: msg }) => {
  console.log({ levelWorkerReceived: msg });

  switch (msg.key) {
    case 'request-new-level': {
      dispatch(Act.registerLevel(msg.levelUid));
      dispatch(Act.updateLevel(msg.levelUid, {
        tileToggleSub: redact(levelToggleHandlerFactory(msg.levelUid).subscribe()),
      }));
      ctxt.postMessage({ key: 'worker-created-level', levelUid: msg.levelUid });
      break;
    }
    case 'request-destroy-level': {
      const level = getLevel(msg.levelUid);
      level?.tileToggleSub?.unsubscribe();
      dispatch(Act.unregisterLevel(msg.levelUid));
      break;
    }
    case 'toggle-level-tile': {
      /** Handled by an rxjs Observable */
      break;
    }
    case 'add-level-meta': {
      const lp = new LevelMeta(msg.metaKey, Vector2.from(msg.position));
      const metas = { ...getLevel(msg.levelUid)!.metas, [lp.key]: lp };
      dispatch(Act.updateLevel(msg.levelUid, { metas: metas }));
      break;
    }
    case 'remove-level-meta': {
      const metas = removeFromLookup(msg.metaKey, getLevel(msg.levelUid)!.metas);
      dispatch(Act.updateLevel(msg.levelUid, { metas }));
      break;
    }
    case 'request-level-data': {
      const level = getLevel(msg.levelUid);
      if (level) {
        ctxt.postMessage({ key: 'send-level-layers', levelUid: msg.levelUid,
          tileFloors: level.tileFloors.map(({ json }) => json),
          wallSegs: Object.values(level.walls),
        });
        ctxt.postMessage({ key: 'send-level-metas', levelUid: msg.levelUid,
          metas: Object.values(level.metas).map(p => p.json),
        });
      }
      break;
    }
    case 'request-level-metas': {
      const level = getLevel(msg.levelUid);
      level && ctxt.postMessage({ key: 'send-level-metas', levelUid: msg.levelUid,
        metas: Object.values(level.metas).map(p => p.json),
      });
      break;
    }
    case 'update-level-meta': {
      const level = getLevel(msg.levelUid);
      if (level && level.metas[msg.metaKey]) {
        level.metas[msg.metaKey].applyUpdates(msg.updates); // Mutation
        ctxt.postMessage({ key: 'send-level-metas', levelUid: msg.levelUid,
          metas: Object.values(level.metas).map(p => p.json),
        });
      }
      break;
    }
  }
});

/**
 * Handle tile toggling for specified level.
 */
function levelToggleHandlerFactory(levelUid: string) {
  return fromEvent<Message<MessageFromLevelParent>>(ctxt, 'message')
    .pipe(
      map(({ data }) => data),
      filter((msg): msg is ToggleLevelTile | ToggleLevelWall =>
        msg.key === 'toggle-level-tile' && msg.levelUid === levelUid
        || msg.key === 'toggle-level-wall' && msg.levelUid === levelUid
      ),
      /**
       * Update tileFloors or walls.
       */
      map((msg) => {
        let { tileFloors, walls } = getLevel(levelUid)!;
        switch (msg.key) {
          case 'toggle-level-tile': {
            const td = msg.type === 'large' ? tileDim : smallTileDim;
            const rect = new Rect2(msg.tile.x, msg.tile.y, td, td);
            tileFloors = Poly2.xor(tileFloors, rect.poly2).map(x => redact(x));
            break;
          }
          case 'toggle-level-wall': {
            walls = { ...walls };
            msg.segs.forEach(([u, v]) => {
              const key = `${u.x},${u.y};${v.x},${v.y}`;
              walls[key] ? delete walls[key] : walls[key] = [u, v];
            });
          }
        }

        dispatch(Act.updateLevel(levelUid, { tileFloors, walls }));
        ctxt.postMessage({
          key: 'send-level-layers',
          levelUid,
          tileFloors: tileFloors.map(({ json }) => json),
          wallSegs: Object.values(walls),
        });
        return null;
      }),
      delay(20),
      /**
       * Update navigable floor.
       */
      map((_) => {
        const { tileFloors, walls } = getLevel(levelUid)!;
        const outsetWalls = Poly2.union(Object.values(walls).map(([u, v]) => new Rect2(
          u.x - floorInset, u.y - floorInset,
          v.x - u.x + 2 * floorInset, v.y - u.y + 2 * floorInset,
        ).poly2));
        const navFloors = Poly2.cutOut(outsetWalls, tileFloors.flatMap(x => x.createInset(floorInset)));

        dispatch(Act.updateLevel(levelUid, { floors: navFloors.map(x => redact(x)) }));
        ctxt.postMessage({
          key: 'send-level-nav-floors',
          levelUid,
          navFloors: navFloors.map(({ json }) => json),
        });
        return navFloors;
      }),
      auditTime(300),
      /**
       * Triangulate (could be refined)
       */
      map(floors => {
        ctxt.postMessage({
          key: 'send-level-tris',
          levelUid, // Mutates floors in level state
          tris: floors.flatMap(x => x.triangulation).map(({ json }) => json),
        });
        return floors;
      }),
      /**
       * Send navgraph
       */
      map(floors => {
        const navGraph = NavGraph.from(floors);
        ctxt.postMessage({
          key: 'send-nav-graph',
          levelUid,
          navGraph: navGraph.json,
          floors: floors.map(({ json }) => json),
        });
        // // floyd warshall test
        // const fw = FloydWarshall.from(navGraph);
        // console.log({ fw });
        return floors;
      }),
      /**
       * TODO Floyd marshall
       */
    );
}

export default {} as Worker & { new (): LevelWorker };
