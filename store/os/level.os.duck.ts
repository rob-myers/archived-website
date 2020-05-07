import { OsAct, levDevVarName } from '@model/os/os.model';
import { createOsThunk, OsThunkAct } from '@model/os/os.redux.model';
import { osMountFileAct, osResolvePathThunk } from './file.os.duck';
import { LevelINode } from '@store/inode/level.inode';
import { DirectoryINode } from '@store/inode/directory.inode';
import { osLookupVarThunk } from './declare.os.duck';

/**
 * Ensure level device.
 * Path name will be /dev/level-${levelName}.
 */
export const osEnsureLevelThunk = createOsThunk<OsAct, EnsureLevelThunk>(
  OsAct.OS_ENSURE_LEVEL_DEVICE_THUNK,
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
  type: OsAct.OS_ENSURE_LEVEL_DEVICE_THUNK;
}

export const osGetLevelDeviceThunk = createOsThunk<OsAct, GetLevelDeviceThunk>(
  OsAct.OS_GET_LEVEL_DEVICE_THUNK,
  ({ dispatch }, { processKey }) => {
    const varValue = dispatch(osLookupVarThunk({ processKey, varName: levDevVarName }));
    const resolved = typeof varValue === 'string'
      ? dispatch(osResolvePathThunk({ processKey, path: varValue }))
      : null;
    return resolved && resolved.iNode.type === 'level' ? resolved.iNode : null;
  },
);

interface GetLevelDeviceThunk extends OsThunkAct<OsAct, { processKey: string }, null | LevelINode> {
  type: OsAct.OS_GET_LEVEL_DEVICE_THUNK;
}
