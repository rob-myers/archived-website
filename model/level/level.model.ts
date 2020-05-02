import { Redacted } from '@model/redux.model';
import * as BABYLON from 'babylonjs';

/** Stored inside main thread. */
export interface LevelState extends LevelStateInit {
  key: string;
}

export interface LevelStateInit {
  canvas: Redacted<HTMLElement>;
  engine: Redacted<BABYLON.Engine>;
  scene: Redacted<BABYLON.Scene>;
}

export function createLevelState(
  levelUid: string,
  { canvas, engine, scene }: LevelStateInit
): LevelState {
  return {
    key: levelUid,
    canvas,
    engine,
    scene,
  };
}
