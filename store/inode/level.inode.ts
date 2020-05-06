import { BaseINode, INodeType } from './base-inode';

/**
 * TODO
 */
export class LevelINode extends BaseINode {

  public readonly devToolsRedaction = LevelINode.name;  
  public readonly readBlocked = false;
  public readonly type = INodeType.level;
  public readonly writeBlocked = false;
  
  public read(_buffer: string[], _maxSize: number, _offset: number): number {
    // Immediate EOF
    return 0;
  }

  public async write(buffer: string[], _offset: number) {
    // Immediate write
    return buffer.splice(0).length;
  }
}
