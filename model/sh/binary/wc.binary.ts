import { BinaryExecType } from '@model/sh/binary.model';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { defaultMaxLines } from '@model/os/file.model';
import { ObservedType } from '@os-service/term.service';
import { osOpenFileThunk } from '@store/os/file.os.duck';
import { BaseBinaryComposite } from './base-binary';

export class WcBinary extends BaseBinaryComposite<BinaryExecType.wc, { string: never[]; boolean: 'l'[] }> {

  public specOpts() {
    return { string: [], boolean: ['l'] as 'l'[] };
  }

  public async *semantics(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    const buffer = [] as string[];
    
    if (!this.operands.length) {// Read from stdin
      while (yield this.read(defaultMaxLines, 0, buffer)); // Terminates immediately?
      const count = this.opts.l
        ? buffer.length
        // We add 1 to pretend there is a final newline
        : buffer.join('\n').length + 1;
      yield this.write(`${count}`);
    }

    for (const filepath of this.operands) {
      try {
        dispatch(osOpenFileThunk({ processKey, request: { fd: 0, mode: 'RDONLY', path: filepath } }));
      } catch (e) {
        yield this.warn(`${filepath}: no such file or directory`);
        this.exitCode = 1;
        continue;
      }

      while (yield this.read(defaultMaxLines, 0, buffer));
      const count = this.opts.l ? buffer.length : buffer.join('\n').length;
      yield this.write(`${filepath}: ${count}`);
    }

  }

}
