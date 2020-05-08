import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osGetLevelDeviceThunk } from '@store/os/level.os.duck';
import { levDevVarName } from '@model/os/os.model';

export class FloorBinary extends BaseBinaryComposite<BinaryExecType.floor> {

  public specOpts() {
    return { string: [], boolean: [] };
  }

  public async *semantics(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    const device = dispatch(osGetLevelDeviceThunk({ processKey }));
    if (device) {
      /**
       * TODO
       * - can add, can remove, can clear
       * - can specify is trigger
       */
      device.run({
        key: 'set-tiles',
        tiles: [[0, 0], [1, 0], [0, 1]],
        enabled: true,
      });
    } else {
      yield this.exit(1, `${levDevVarName} must resolve to a level device`);
    }
  }
}
