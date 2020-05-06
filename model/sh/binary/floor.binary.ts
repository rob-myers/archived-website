import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';

export class FloorBinary extends BaseBinaryComposite<BinaryExecType.floor> {

  public specOpts() {
    return { string: [], boolean: [] };
  }

  public async *semantics(): AsyncIterableIterator<ObservedType> {
    /**
     * TODO
     * - add/remove floor tile to scene via coords (top-left of square)
     * - can specify is trigger
     */
  }

}
