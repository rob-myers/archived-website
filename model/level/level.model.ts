import { Redacted } from '@model/redux.model';
import * as BABYLON from 'babylonjs';
import { LevelClient } from '@model/client/level.client';

/** Stored inside main thread. */
export interface LevelState extends LevelStateInit {
  key: string;
  /** Are we rendering? */
  rendering: boolean;
}

export interface LevelStateInit {
  canvas: Redacted<HTMLElement>;
  engine: Redacted<BABYLON.Engine>;
  scene: Redacted<BABYLON.Scene>;
  /** Talks to LevelINode inside OsWorker */
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
  };
}

export type LevelOptionCommand = {
  uid: string;
} & (
  | { key: 'render'; shouldRender: boolean }
);
