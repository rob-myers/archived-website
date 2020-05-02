import { LevelWorkerContext } from '@model/level/level.worker.model';
import { LevelDispatchOverload } from '@model/level/level.redux.model';
import { Act } from '@store/level/level.duck';
import { store } from './create-store';

const ctxt: LevelWorkerContext = self as any;
const dispatch = store.dispatch as LevelDispatchOverload;

export function listenForRequests() {
  ctxt.addEventListener('message', async ({ data: msg }) => {
    console.log({ levelWorkerReceived: msg });
  
    switch (msg.key) {
      case 'request-new-level': {
        dispatch(Act.registerLevel(msg.levelUid));
        dispatch(Act.updateLevel(msg.levelUid, {
          //
        }));
        ctxt.postMessage({
          key: 'worker-created-level',
          levelUid: msg.levelUid,
        });
        break;
      }
      case 'request-destroy-level': {
        // const level = getLevel(msg.levelUid);
        dispatch(Act.unregisterLevel(msg.levelUid));
        break;
      }
    }
  });
}
