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
       * - add/remove floor tile to scene via coords (top-left of square)
       * - can specify is trigger
       */
    } else {
      yield this.exit(1, `${levDevVarName} must resolve to a level device`);
    }
  }
}
