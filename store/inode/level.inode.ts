import { BaseINode, INodeType, BaseINodeDef } from './base-inode';

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

  private printPending() {
    if (this.cmdBuffer.length && !this.nextDrainId) {
      this.nextDrainId = window.setTimeout(this.runCommands, this.def.refreshMs);
    }
  }

  private queueCommands(cmds: LevelDeviceCmd[]) {
    for (const cmd of cmds) {
      this.cmdBuffer.push(cmd);
    }
    this.printPending();
  }

  public read(_buffer: string[], _maxSize: number, _offset: number): number {
    /**
     * TODO output all of textual representation
     */
    return 0; // Immediate EOF
  }

  public run(cmd: LevelDeviceCmd) {
    this.queueCommands([cmd]);
  }
  
  private async runCommands(cmds: LevelDeviceCmd[]) {
    for (const cmd of cmds.splice(0, this.def.cmdsPerDrain)) {
      await this.def.sendLevelCmd(cmd);

      switch (cmd.key) {
        case 'clear': {
          // TODO clear internal
          break;
        }
        case 'set-tiles': {
          // TODO augment internal
          break;
        }
      }
    }
    this.nextDrainId = null;
  }

  public async write(buffer: string[], _offset: number) {
    return buffer.splice(0).length; // Immediate write
  }
}

export type LevelDeviceCmd = (
  | { key: 'set-tiles'; tiles: [number, number][]; enabled: boolean }
  | { key: 'clear' }
);

export interface LevelINodeDef extends BaseINodeDef {
  cmdsPerDrain: number;
  refreshMs: number;
  sendLevelCmd: (cmd: LevelDeviceCmd) => Promise<void>;
}
