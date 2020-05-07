import { OsAct } from '@model/os/os.model';
import { createOsThunk, OsThunkAct } from '@model/os/os.redux.model';
import { osMountFileAct } from './file.os.duck';
import { LevelINode } from '@store/inode/level.inode';
import { DirectoryINode } from '@store/inode/directory.inode';

/**
 * Ensure level device.
 * Path name will be /dev/level-${levelName}.
 */
export const osEnsureLevelThunk = createOsThunk<OsAct, EnsureLevelThunk>(
  OsAct.OS_ENSURE_LEVEL_THUNK,
  ({ dispatch, state: { os } }, { levelName }) => {
    const filename = `level-${levelName}`;
    const dev = os.root.to.dev as DirectoryINode;
    if (!dev.to[filename]) {
      const iNode = new LevelINode({ userKey: 'root', groupKey: 'root' });
      dispatch(osMountFileAct({ parent: dev, filename, iNode }));
    }
  },
);

interface EnsureLevelThunk extends OsThunkAct<OsAct, {
  /** `levelName` should be alphanumeric */
  levelName: string;
}, void> {
  type: OsAct.OS_ENSURE_LEVEL_THUNK;
}
