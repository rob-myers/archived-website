import { BaseBuiltinComposite } from './base-builtin';
import { BuiltinOtherType } from '../builtin.model';
import { ObservedType } from '@os-service/term.service';
import { sigIntsOpts, sigKeysOpts, SigEnum, sigIntToEnum, sigShortKeysOpts } from '@model/os/process.model';
import { OsDispatchOverload } from '@model/os/os.redux.model';
import { osHandleSignalThunk, osGetProcessesMeta } from '@store/os/process.os.duck';

/**
 * e.g. `kill -1 --SIGHUP --HUP {pid}`
 */
export class KillBuiltin extends BaseBuiltinComposite<
  BuiltinOtherType.kill,
  { string: never[]; boolean: ('l')[] }
> {

  public specOpts() {
    return {
      string: [],
      boolean: ['l', ...sigIntsOpts, ...sigKeysOpts, ...sigShortKeysOpts] as 'l'[],
    };
  }

  public async *semantics(dispatch: OsDispatchOverload): AsyncIterableIterator<ObservedType> {
    if (this.opts.l) {
      yield this.write(this.signalsText());
      yield this.exit();
    }
    const opts = Object.keys(this.opts).filter(x => (this.opts as any)[x]);

    const signals = ([] as SigEnum[]).concat(
      opts.filter((x): x is SigEnum => x in SigEnum),
      opts.filter((x) => sigIntsOpts.includes(x)).map(x => sigIntToEnum[Number(x)]),
      opts.filter((x) => sigShortKeysOpts.includes(x)).map(x => `SIG${x}` as SigEnum)
    ).reduce<SigEnum[]>((agg, sig) => (agg.concat(sig)), []);

    if (!signals.length) {// Default to SIGTERM
      signals.push(SigEnum.SIGTERM);
    }
    const pids = this.operands.map(x => parseInt(x))
      .filter(x => Number.isFinite(x) && x > 0);
    // console.log({ sigs: signals, pids });

    const pidToKey = dispatch(osGetProcessesMeta({})).metas.reduce<Record<number, string>>(
      (agg, { pid, processKey }) => ({ ...agg, [pid]: processKey }), {});

    for (const pid of pids) {
      const otherProcessKey = pidToKey[pid];
      if (!otherProcessKey) {
        yield this.warn(`(${pid}) - No such process`);
        continue;
      }
      for (const signal of signals) {
        dispatch(osHandleSignalThunk({ processKey: otherProcessKey, signal }));
      }
    }
  }

  private signalsText() {
    return [
      '1) SIGHUP	 2) SIGINT	 3) SIGQUIT	 4) SIGILL	 5) SIGTRAP',
      '6) SIGABRT	 7) SIGEMT	 8) SIGFPE	 9) SIGKILL	10) SIGBUS',
      '11) SIGSEGV	12) SIGSYS	13) SIGPIPE	14) SIGALRM	15) SIGTERM',
      '16) SIGURG	17) SIGSTOP	18) SIGTSTP	19) SIGCONT	20) SIGCHLD',
      '21) SIGTTIN	22) SIGTTOU	23) SIGIO	24) SIGXCPU	25) SIGXFSZ',
      '26) SIGVTALRM	27) SIGPROF	28) SIGWINCH	29) SIGINFO	30) SIGUSR1',
      '31) SIGUSR2',
    ];
  }

}
