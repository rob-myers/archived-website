import { BaseMessage, Message } from '@model/worker.model';

/** A Worker instance in parent thread. */
export interface LevelWorker extends Worker {
  postMessage(message: MessageFromLevelParent): void;
  addEventListener(type: 'message', listener: (message: Message<MessageFromLevelWorker>) => void): void;
  addEventListener(type: 'message', object: EventListenerObject): void;
}

/** A web worker. */
export interface LevelWorkerContext extends Worker {
  postMessage(message: MessageFromLevelWorker): void;
  addEventListener(type: 'message', listener: (message: Message<MessageFromLevelParent>) => void): void;
  addEventListener(type: 'message', object: EventListenerObject): void; 
}

interface PingFromParent extends BaseMessage {
  key: 'ping-level-worker';
}
interface PongFromWorker extends BaseMessage {
  key: 'pong-from-level';
}

interface LevelWorkerReady extends BaseMessage {
  key: 'level-worker-ready';
}

interface RequestNewLevel extends BaseMessage {
  key: 'request-new-level';
  levelUid: string;
}
interface RequestDestroyLevel extends BaseMessage {
  key: 'request-destroy-level';
  levelUid: string;
}
interface WorkerCreatedLevel extends BaseMessage {
  key: 'worker-created-level';
  levelUid: string;
}


export type MessageFromLevelParent = (
  | PingFromParent
  | RequestNewLevel
  | RequestDestroyLevel
);
export type MessageFromLevelWorker = (
  | PongFromWorker
  | LevelWorkerReady
  | WorkerCreatedLevel
);

// Shortcut
type MsgFrmWrk<Key> = Extract<MessageFromLevelWorker, { key: Key }>

export async function awaitWorker<Key extends MessageFromLevelWorker['key']>(
  key: Key,
  worker: LevelWorker,
  /** Return truthy iff message received */
  isMessage: (message: MsgFrmWrk<Key>) => boolean = () => true,
  act?: (message: MsgFrmWrk<Key>) => void
): Promise<MsgFrmWrk<Key>> {
  return new Promise(resolve => {
    const listener = (message: Message<MessageFromLevelWorker>) => {
      if (message.data.key === key) {
        const data = message.data as MsgFrmWrk<Key>;
        if (isMessage(data)) {
          worker.removeEventListener('message', listener);
          act && act(data);
          resolve(data);
        }
      }
    };
    worker.addEventListener('message', listener);
  });
}
