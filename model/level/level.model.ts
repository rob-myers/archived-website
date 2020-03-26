import { Redacted, redact } from '@model/redux.model';
import { Poly2 } from '@model/poly2.model';
import { Subscription, Subject } from 'rxjs';
import { Rect2 } from '@model/rect2.model';
import { Vector2, Vector2Json } from '@model/vec2.model';
import { KeyedLookup } from '@model/generic.model';
import { LevelMetaUi, LevelMeta } from './level-meta.model';
import { FloydWarshall } from '@model/nav/floyd-warshall.model';
import { FloydWarshallReady } from './level.worker.model';
import { TileGraph } from '@model/nav/tile-graph';
import { smallTileDim } from './level-params';

export type Direction = 'n' | 'e' | 's' | 'w'; 

/**
 * Stored inside level web worker.
 */
export interface LevelState {
  key: string;
  /** Floor induced by tiles */
  tileFloors: Redacted<Poly2>[];
  /** Line segments aligned to refined grid */
  wallSeg: Record<string, [Vector2Json, Vector2Json]>;
  /** Navigable polygon induced by tileFloors and walls */
  floors: Redacted<Poly2>[];
  /** Tile/wall toggle handler */
  tileToggleSub: null | Redacted<Subscription>;
  /** Meta update handler */
  metaUpdateSub: null | Redacted<Subscription>;
  /** Spawn points, steiner points, lights, interactives */
  metas: KeyedLookup<LevelMeta>;
  /** Pathfinder (might remove it) */
  floydWarshall: null | Redacted<FloydWarshall>;
  /**
   * TODO new tile-based layout
   */
  grid: Redacted<TileGraph>;
}

export function createLevelState(uid: string): LevelState {
  return {
    key: uid,
    tileFloors: [],
    wallSeg: {},
    floors: [],
    tileToggleSub: null,
    metaUpdateSub: null,
    metas: {},
    floydWarshall: null,
    grid: redact(new TileGraph()),
  };
}

export interface LevelUiState {
  /** Level identifier e.g. `level-1` */
  key: string;
  /** Top left of square cursor (snapped to grid) */
  cursor: Vector2;
  /** Large or small square? */
  cursorType: 'default' | 'refined';
  /** The 4 edges of the cursor can be highlighted */
  cursorHighlight: Partial<Record<Direction, boolean>>;
  /** Key of dragged meta, if any */
  draggedMeta: null | string;
  /** UIs for LevelState.metas */
  metaUi: KeyedLookup<LevelMetaUi>;
  /** Editing or in live mode */
  mode: 'edit' | 'live';
  /** Mouse position in world coords */
  mouseWorld: Vector2;
  /** Can forward notifications to LevelNotify */
  notifyForwarder: null | Redacted<Subject<ForwardedNotification>>;
  /** Viewport bounds in world coords. */
  renderBounds: Rect2;
  /** Should visualisation of NavGraph? */
  showNavGraph: boolean;
  /** Show 3d walls? */
  showThreeD: boolean;
  /** CSS theme */
  theme: 'light-mode' | 'dark-mode';
  /** Can forward wheel events (pan/zoom) to LevelMouse  */
  wheelForwarder: null | Redacted<Subject<ForwardedWheelEvent>>;
  /** Zoom multiplier with default `1` */
  zoomFactor: number;
}

export interface ForwardedWheelEvent {
  key: 'wheel';
  e: React.WheelEvent;
}

export type ForwardedNotification = (
  | { key: 'floyd-warshall-ready'; orig: FloydWarshallReady }
  | { key: 'ping' }
);

export function createLevelUiState(uid: string): LevelUiState {
  return {
    key: uid,
    cursor: Vector2.zero,
    cursorType: 'default',
    cursorHighlight: {},
    draggedMeta: null,
    metaUi: {},
    mode: 'edit',
    mouseWorld:  Vector2.zero,
    notifyForwarder: null,
    renderBounds: Rect2.zero,
    showNavGraph: false,
    showThreeD: false,
    theme: 'light-mode',
    wheelForwarder: null,
    zoomFactor: 1,
  };
}

/**
 * For large tiles we create 3 line segments.
 * Part of approach to avoid extruding 1-dim polygons.
 */
export function computeLineSegs(td: number, from: Vector2, dir: Direction): [Vector2, Vector2][] {
  let seg: [Vector2, Vector2];
  switch (dir) {
    case 'n': seg = [new Vector2(from.x, from.y), new Vector2(from.x + smallTileDim, from.y)]; break;
    case 'e': seg = [new Vector2(from.x + td, from.y), new Vector2(from.x + td, from.y + smallTileDim)]; break;
    case 's': seg = [new Vector2(from.x, from.y + td), new Vector2(from.x + smallTileDim, from.y + td)]; break;
    case 'w': seg = [new Vector2(from.x, from.y), new Vector2(from.x, from.y + smallTileDim)]; break;
  }

  if (td === smallTileDim) {
    return [seg];
  }
  const d = dir === 'n' || dir === 's'
    ? new Vector2(smallTileDim, 0) : new Vector2(0, smallTileDim);
  return [seg, seg, seg].map(([u, v], i) =>
    [u.clone().translate(i * d.x, i * d.y), v.clone().translate(i * d.x, i * d.y)]);
}
