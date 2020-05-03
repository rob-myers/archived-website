import { BinaryExecType } from '@model/sh/binary.model';
import { BaseBinaryComposite } from './base-binary';
import { ObservedType } from '@os-service/term.service';

export class MeshBinary extends BaseBinaryComposite<BinaryExecType.mesh> {

  public specOpts() {
    return { string: [], boolean: [] };
  }

  public async *semantics(): AsyncIterableIterator<ObservedType> {
    /**
     * TODO
     * - add/remove mesh to scene
     * - need to select level e.g. via /dev/level-1 and levelKey
     * - import some 3d models made in blender
     * - make levels by connecting together 'modules' built this way
     */
  }

}
