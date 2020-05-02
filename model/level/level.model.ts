/** Stored inside level web worker. */
export interface LevelState {
  key: string;
  /**
   * Level geometry
   */
}

export function createLevelState(uid: string): LevelState {
  return {
    key: uid,
  };
}
