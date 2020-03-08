import { combineReducers } from 'redux';
import {
  State as LevelsState, 
  Action as LevelAction,
  // Thunk as OsThunk,
  reducer as levelReducer,
} from '@store/level/level.worker.duck';

export interface LevelWorkerState {
  level: LevelsState;
}

export type LevelWorkerAction = (
  | LevelAction
);

export type LevelWorkerThunk = (
  // | LevelThunk
  | never
);

const rootReducer = combineReducers<LevelWorkerState>({
  level: levelReducer,
});

export default rootReducer;