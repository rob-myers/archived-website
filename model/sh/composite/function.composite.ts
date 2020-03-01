import { BaseCompositeTerm } from './base-composite';
import { CompositeType, Term } from '@model/os/term.model';
import { BaseTermDef } from '../base-term';
import { ObservedType } from '@os-service/term.service';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osGetFunctionThunk, osAddFunctionAct } from '@store/os/declare.os.duck';
import { osCloneTerm, osWalkTerm } from '@store/os/parse.os.duck';

/**
 * function
 */
export class FunctionComposite extends BaseCompositeTerm<CompositeType.function> {
  constructor(public def: FunctionCompositeDef) {
    super(def);
  }

  public get children(): Term[] {
    return [];
  }

  public async *semantics(dispatch: OsDispatchOverload, processKey: string): AsyncIterableIterator<ObservedType> {
    const func = dispatch(osGetFunctionThunk({ processKey, functionName: this.def.funcName }));

    // Cannot overwrite readonly function
    if (func && func.readonly) {
      yield this.exit(1, `${this.def.funcName}: readonly function`);
    }

    const clonedBody = dispatch(osCloneTerm({ term: this.def.body }));

    // Handle case where no source-map
    if (!this.def.src || !clonedBody.def.sourceMap) {
      dispatch(osAddFunctionAct({ processKey, funcName: this.def.funcName, term: clonedBody, src: null }));
      yield this.exit(0);
      return;
    }
    
    // Walk cloned Term, offsetting source-map
    const { col: firstCol, row: firstRow, offset: firstIndex } = clonedBody.def.sourceMap.from;

    dispatch(osWalkTerm({
      term: clonedBody,
      action: ({ def: { sourceMap: sm } }) => {
        if (sm) {
          const cps = [sm.from, sm.to];// Collect all code positions.
          (sm.extra || []).forEach((x) => cps.push(x.pos) && x.end && cps.push(x.end));
          cps.forEach((cp) => {// Offset them.
            if (cp.row === firstRow) {
              cp.col -= (firstCol - 1);
            }
            cp.row -= (firstRow - 1);
            cp.offset -= firstIndex;
          });
        }
      },
    }));

    dispatch(osAddFunctionAct({ processKey, funcName: this.def.funcName, term: clonedBody, src: this.def.src }));
  }
}
interface FunctionCompositeDef extends BaseTermDef<CompositeType.function>, FunctionDef {}

interface FunctionDef {
  funcName: string;
  body: Term;
}
