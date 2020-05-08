import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osGetLevelDeviceThunk } from '@store/os/level.os.duck';
import { levDevVarName } from '@model/os/os.model';

const coordRegex = /^(\d+),(\d+)$/;
type BooleanOpts = 'c' | 'clear' | 'r' | 'remove';

/**
 * TODO can specify is trigger.
 */
export class FloorBinary extends BaseBinaryComposite<
  BinaryExecType.floor,
  { string: never[]; boolean: BooleanOpts[] }
> {

  public specOpts() {
    return { string: [], boolean: ['c', 'clear', 'r', 'remove'] as BooleanOpts[] };
  }

  public async *semantics(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    const device = dispatch(osGetLevelDeviceThunk({ processKey }));
    if (device) {
      if (this.opts.c || this.opts.clear) {
        if (!this.operands.length) {
          await device.run({ key: 'clear', what: 'tiles' });
          yield this.exit();
        }
        yield this.exit(1, `unexpected operand ${this.operands[0]}`);
      }

      const tiles = [] as [number, number][];
      for (const operand of this.operands) {
        const matched = operand.match(coordRegex);
        if (matched) {
          tiles.push([Number(matched[1]), Number(matched[2])]);
        } else {
          yield this.exit(1, `unexpected operand ${operand}`);
        }
      }

      const enabled = !(this.opts.r || this.opts.remove);
      await device.run({ key: 'set-tiles', tiles, enabled });

    } else {
      yield this.exit(1, `${levDevVarName} must resolve to a level device`);
    }
  }
}
