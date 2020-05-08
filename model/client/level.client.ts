import { MessageFromOsWorker } from '@model/os/os.worker.model';
import { BaseOsClient, BaseOsClientDef } from './base-os-client';
import { Message } from '@model/worker.model';

export class LevelClient extends BaseOsClient<LevelClientDef> {

  constructor(protected def: LevelClientDef) {
    super(def);
  }

  public async initialise() {
    super.initialise();
    this.def.osWorker.postMessage({
      key: 'ensure-level-device',
      levelKey: this.def.levelKey,
    });
  }

  protected onWorkerMessage = ({ data: msg }: Message<MessageFromOsWorker>) => {
    if (msg.key === 'send-level-cmd' && msg.levelKey === this.def.levelKey) {
      
      console.log({ receivedMsg: msg });
      /**
       * TODO
       */
      this.def.osWorker.postMessage({
        key: 'ack-level-cmd',
        levelKey: msg.levelKey,
        messageUid: msg.messageUid,
      });
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LevelClientDef extends BaseOsClientDef {
  levelKey: string;
}
