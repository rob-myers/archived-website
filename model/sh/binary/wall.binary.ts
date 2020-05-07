import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';
import { osGetLevelDeviceThunk } from '@store/os/level.os.duck';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { levDevVarName } from '@model/os/os.model';

export class WallBinary extends BaseBinaryComposite<BinaryExecType.wall> {

  public specOpts() {
    return { string: [], boolean: [] };
  }

  public async *semantics(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    const device = dispatch(osGetLevelDeviceThunk({ processKey }));
    if (device) {
      /**
       * TODO
       * - add/remove walls via coords
       */
    } else {
      yield this.exit(1, `${levDevVarName} must resolve to a level device`);
    }
  }
}
