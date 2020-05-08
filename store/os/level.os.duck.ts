import { generate } from 'shortid';
import { OsAct, levDevVarName } from '@model/os/os.model';
import { createOsThunk, OsThunkAct } from '@model/os/os.redux.model';
import { osMountFileAct, osResolvePathThunk } from './file.os.duck';
import { LevelINode, ExternalLevelCmd } from '@store/inode/level.inode';
import { DirectoryINode } from '@store/inode/directory.inode';
import { osLookupVarThunk } from './declare.os.duck';
import { awaitParent } from '@model/os/os.worker.model';

/**
 * Ensure level device.
 * Path name will be /dev/level-${levelKey}.
 */
export const osEnsureLevelThunk = createOsThunk<OsAct, EnsureLevelThunk>(
  OsAct.OS_ENSURE_LEVEL_DEVICE_THUNK,
  ({ dispatch, state: { os }, worker }, { levelKey }) => {
    const filename = `level-${levelKey}`;
    const dev = os.root.to.dev as DirectoryINode;

    if (!dev.to[filename]) {
      const iNode = new LevelINode({
        userKey: 'root',
        groupKey: 'root',
        cmdsPerDrain: 10,
        refreshMs: 10,
        sendLevelCmd: async (cmd: ExternalLevelCmd) => {
          const messageUid = `msg-${generate()}`;
          worker.postMessage({ key: 'send-level-cmd', levelKey, cmd, messageUid });
          await awaitParent('ack-level-cmd', worker, ({ messageUid: other }) => other === messageUid);
        },
      });
      dispatch(osMountFileAct({ parent: dev, filename, iNode }));
    }
  },
);

/** `levelKey` should be alphanumeric */
interface EnsureLevelThunk extends OsThunkAct<OsAct, { levelKey: string }, void> {
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
