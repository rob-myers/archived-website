import { BaseINode, INodeType, BaseINodeDef } from './base-inode';
import { testNever } from '@model/generic.model';

export class LevelINode extends BaseINode {

  public readonly devToolsRedaction = LevelINode.name;  
  public readonly readBlocked = false;
  public readonly type = INodeType.level;
  public readonly writeBlocked = false;
  private cmdBuffer: LevelDeviceCmd[];
  private nextDrainId: null | number;
  
  constructor(public def: LevelINodeDef) {
    super(def);
    this.cmdBuffer = [];
    this.nextDrainId = null;
  }

  private runPending() {
    if (this.cmdBuffer.length && !this.nextDrainId) {
      this.nextDrainId = (setTimeout as Window['setTimeout'])(this.runCommands, this.def.refreshMs);
    }
  }

  private queueCommands(cmds: LevelDeviceCmd[]) {
    for (const cmd of cmds) this.cmdBuffer.push(cmd);
    this.runPending();
  }

  public read(_buffer: string[], _maxSize: number, _offset: number): number {
    /**
     * TODO output all of textual representation
     */
    return 0; // Immediate EOF
  }

  public async run(cmd: LevelDeviceCmd) {
    await new Promise(resolve => {
      this.queueCommands([cmd, { key: 'resolve', resolve }]);
    });
  }
  
  private runCommands = async () => {
    for (const cmd of this.cmdBuffer.splice(0, this.def.cmdsPerDrain)) {
      if (isExternalCommand(cmd)) {
        await this.def.sendLevelCmd(cmd);
      }

      switch (cmd.key) {
        case 'clear': {
          // TODO clear internal
          break;
        }
        case 'set-tiles': {
          // TODO augment internal
          break;
        }
        case 'resolve': {
          cmd.resolve();
          break;
        }
        default: throw testNever(cmd);
      }
    }
    this.nextDrainId = null;
    this.runPending();
  }

  public async write(buffer: string[], _offset: number) {
    return buffer.splice(0).length; // Immediate write
  }
}

type LevelDeviceCmd = (
  | { key: 'clear'; what: 'all' | 'tiles' | 'walls' }
  | { key: 'set-tiles'; tiles: [number, number][]; enabled: boolean }
  | { key: 'resolve'; resolve: () => void }
);

export type ExternalLevelCmd = Extract<LevelDeviceCmd, {
  key: 'set-tiles' | 'clear';
}>

function isExternalCommand(cmd: LevelDeviceCmd): cmd is ExternalLevelCmd {
  return cmd.key === 'set-tiles' || cmd.key === 'clear';
}

export interface LevelINodeDef extends BaseINodeDef {
  cmdsPerDrain: number;
  refreshMs: number;
  sendLevelCmd: (cmd: ExternalLevelCmd) => Promise<void>;
}
