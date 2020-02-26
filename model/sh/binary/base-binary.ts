import getopts from 'getopts';
import { BaseCompositeTerm } from '../composite/base-composite';
import { CompositeType, Term } from '@model/os/term.model';
import { BinaryType, isBinaryUiType } from '../binary.model';
import { GetOpts } from '@model/os/os.model';
import { BaseTermDef } from '../base-term';
import { simplifyGetOpts } from '@service/filesystem.service';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { ObservedType } from '@service/term.service';
import { osLaunchGuiThunk } from '@store/os/session.os.duck';

/**
 * base binary
 */
export abstract class BaseBinaryComposite<
  ExactKey extends BinaryType,
  SpecOpts extends { string: string[]; boolean: string[] } = {
    string: never[];
    boolean: never[];
  }
> extends BaseCompositeTerm<CompositeType.binary> {
 
  public binaryKey: ExactKey;
  /** Computed via npm module getopts. */
  public opts: GetOpts<SpecOpts['string'][0], SpecOpts['boolean'][0]>;
  /** Shortcut to {this.opts._}. */
  public operands: string[];
  public unknownOpts: string[];

  public get children(): Term[] {
    return [];
  }
  /** Must return options specification (static data). */
  public abstract specOpts(): SpecOpts

  constructor(public def: BaseBinaryCompositeDef<ExactKey>) {
    super(def);
    this.binaryKey = def.binaryKey;

    this.opts = getopts(def.args, this.specOpts()) as GetOpts<SpecOpts['string'][0], SpecOpts['boolean'][0]>;
    simplifyGetOpts(this.opts);
    this.operands = this.opts._;
    this.unknownOpts = this.getUnknownOpts();
  }

  protected getUnknownOpts(): string[] {
    const { boolean, string } = this.specOpts();
    return Object.keys(this.opts)
      .filter((x) => x !== '_' && !boolean.includes(x) && !string.includes(x));
  }

  public async *runGui(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    if (isBinaryUiType(this.binaryKey)) {
      const { toPromise } = dispatch(osLaunchGuiThunk({ processKey, guiKey: this.binaryKey }));
      await toPromise();
    } else {
      yield this.exit(1, `internal error: ${this.binaryKey} has no gui`);
    }
  }

}
interface BaseBinaryCompositeDef<ExactKey extends BinaryType> extends BaseTermDef<CompositeType.binary>, BaseBinaryDef<ExactKey> {}

interface BaseBinaryDef<ExactKey extends BinaryType> {
  binaryKey: ExactKey;
  args: string[];
}