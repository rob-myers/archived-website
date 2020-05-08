import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osGetLevelDeviceThunk } from '@store/os/level.os.duck';
import { levDevVarName } from '@model/os/os.model';

const coordRegex = /^(-?\d+),(-?\d+)$/;
type StringOpts = 'o' | 'offset'
type BooleanOpts = 'c' | 'clear' | 'r' | 'remove';

/**
 * TODO can specify is trigger.
 */
export class FloorBinary extends BaseBinaryComposite<
  BinaryExecType.floor,
  { string: StringOpts[]; boolean: BooleanOpts[] }
> {

  public specOpts() {
    return {
      string: ['o', 'offset'] as StringOpts[],
      boolean: ['c', 'clear', 'r', 'remove'] as BooleanOpts[],
    };
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

      let offset = [0, 0] as [number, number];
      const offsetValue = this.def.args.find((_, i, items) =>
        items[i-1] === '-o' || items[i-1] === '--offset');
      if (offsetValue) {
        const matched = offsetValue.match(coordRegex);
        if (matched) {
          offset = [Number(matched[1]), Number(matched[2])];
        } else {
          yield this.exit(1, `unexpected offset ${offsetValue}`);
        }
      }

      const tiles = [] as [number, number][];
      for (const operand of this.customOperands()) {
        const matched = operand.match(coordRegex);
        if (matched) {
          tiles.push([Number(matched[1]), Number(matched[2])]);
        } else {
          yield this.exit(1, `unexpected operand ${operand}`);
        }
      }

      await device.run({
        key: 'set-tiles',
        tiles,
        enabled: !(this.opts.r || this.opts.remove),
        offset,
      });

    } else {
      yield this.exit(1, `${levDevVarName} must resolve to a level device`);
    }
  }

  private customOperands() {
    const { fromBool, fromString } = this.getOptLookups();
    return this.def.args
      .filter(x => !fromBool[x]) // Discard boolean opts
      .reduce( // Discard string opts
        (agg, x, i, items) => fromString[items[i-1]] ? agg.slice(0, -1) : agg.concat(x),
        [] as string[],
      );
  }
}
