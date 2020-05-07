import { MessageFromOsWorker, awaitWorker } from '@model/os/os.worker.model';
import { BaseOsClient, BaseOsClientDef } from './base-os-client';
import { Message } from '@model/worker.model';

/**
 * TODO
 */
export class LevelClient extends BaseOsClient<LevelClientDef> {

  constructor(protected def: LevelClientDef) {
    super(def);
  }

  public async initialise() {
    super.initialise();
    this.def.osWorker.postMessage({
      key: 'ensure-level-device',
      levelName: this.def.levelName,
    });
  }

  protected onWorkerMessage = ({ data: _msg }: Message<MessageFromOsWorker>) => {
    // switch (msg.key) {
    //   case '__TODO__': {
    //     //
    //     break;
    //   }
    // }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LevelClientDef extends BaseOsClientDef {
  levelName: string;
}
