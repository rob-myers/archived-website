import * as BABYLON from 'babylonjs';
import { Redacted } from '@model/redux.model';
import { LevelClient } from '@model/client/level.client';
import { Poly2 } from '@model/poly2.model';

/** Stored inside main thread. */
export interface LevelState extends LevelStateInit {
  key: string;
  /** Are we rendering? */
  rendering: boolean;
  /** With keys like `3,-2` */
  tiles: Record<string, Redacted<BABYLON.Mesh>>;
  /** Internal walls With keys like `3,-2` */
  walls: Record<string, Redacted<BABYLON.Mesh>>;
  tilePolys: Redacted<Poly2>[];
  extWalls: Redacted<BABYLON.Mesh>[];
}

export interface LevelStateInit {
  canvas: Redacted<HTMLElement>;
  engine: Redacted<BABYLON.Engine>;
  scene: Redacted<BABYLON.Scene>;
  /** Paired with a LevelINode inside OsWorker */
  client: Redacted<LevelClient>;
}

export function createLevelState(
  levelUid: string,
  { canvas, engine, scene, client }: LevelStateInit
): LevelState {
  return {
    key: levelUid,
    canvas,
    engine,
    scene,
    rendering: false,
    client,
    tiles: {},
    walls: {},
    tilePolys: [],
    extWalls: [],
  };
}

export type LevelOptionCommand = {
  uid: string;
} & (
  | { key: 'render'; shouldRender: boolean }
);
