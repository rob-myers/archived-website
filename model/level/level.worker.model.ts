import { fromEvent } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseMessage, Message } from '@model/worker.model';

/** A Worker instance in parent thread. */
export interface LevelWorker extends Worker {
  postMessage(message: MessageFromLevelParent): void;
  postMessage(message: MessageFromLevelParent, transfer: Transferable[]): void;
  addEventListener(type: 'message', listener: (message: Message<MessageFromLevelWorker>) => void): void;
  addEventListener(type: 'message', object: EventListenerObject): void;
  removeEventListener(type: 'message', listener: (message: Message<MessageFromLevelWorker>) => void): void;
  removeEventListener(type: 'message', object: EventListenerObject): void;
}

/** A web worker. */
export interface LevelWorkerContext extends Worker {
  postMessage(message: MessageFromLevelWorker): void;
  addEventListener(type: 'message', listener: (message: Message<MessageFromLevelParent>) => void): void;
  addEventListener(type: 'message', object: EventListenerObject): void; 
  removeEventListener(type: 'message', listener: (message: Message<MessageFromLevelParent>) => void): void;
  removeEventListener(type: 'message', object: EventListenerObject): void;
}

interface LevelWorkerReady extends BaseMessage {
  key: 'level-worker-ready';
}

interface RequestNewLevel extends BaseMessage {
  key: 'request-new-level';
  levelUid: string;
  canvas: OffscreenCanvas;
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
  | RequestNewLevel
  | RequestDestroyLevel
);

export type MessageFromLevelWorker = (
  | LevelWorkerReady
  | WorkerCreatedLevel
);

// Shortcut
type MsgFrmWrk<Key> = Extract<MessageFromLevelWorker, { key: Key }>

export const awaitWorker = <Key extends MessageFromLevelWorker['key']>(
  key: Key,
  worker: LevelWorker,
): Promise<MsgFrmWrk<Key>> => new Promise(resolve => {
  const listener = (message: Message<MessageFromLevelWorker>) => {
    if (message.data.key === key) {
      worker.removeEventListener('message', listener);
      resolve(message.data as MsgFrmWrk<Key>);
    }
  };
  worker.addEventListener('message', listener);
});

export function subscribeToWorker(
  worker: LevelWorker,
  handler: (msg: MessageFromLevelWorker) => void, 
) {
  return fromEvent<Message<MessageFromLevelWorker>>(worker, 'message')
    .pipe(
      map(({ data }) => data),
      tap(handler)
    ).subscribe();
}
