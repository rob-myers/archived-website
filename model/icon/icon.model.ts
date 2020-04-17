import { Rect2 } from '@model/rect2.model';
import { KeyedLookup } from '@model/generic.model';
import { Vector2 } from '@model/vec2.model';

export type IconType = (
  | 'door-1'
  | 'light-1'
  | 'rect-1'
  | 'circ-1'
  | 'meta-1'
);

export const iconLookup: KeyedLookup<IconMeta, IconType> = {
  ...addIcon('door-1'),
  ...addIcon('light-1'),
  ...addIcon('rect-1'),
  ...addIcon('circ-1'),
  ...addIcon('meta-1'),
};

interface IconMeta {
  /** Unique identifier */
  key: IconType;
  /** Source SVG as plain text */
  svg: string;
  /** Rectangular area to select from source SVG */
  srcRect: Rect2;
  /** Rectangular area in world coords */
  dstRect: Rect2;
}

function addIcon(
  key: IconType,
  filename = key,
  srcRect = new Rect2(0, 0, 100, 100),
  dstRect = new Rect2(0, 0, 2, 2),
) {
  return {
    [key]: {
      key,
      svg: require(`./${filename}.svg`),
      srcRect,
      dstRect,
    },
  };
}

export interface Icon {
  key: IconType;
  svg: string;
  rect: Rect2;
  scale: number;
  delta: Vector2;
}

export function createIcon(key: IconType) {
  const icon = iconLookup[key];
  return {
    key,
    svg: icon.svg,
    rect: icon.dstRect.clone(),
    scale: icon.dstRect.dimension / icon.srcRect.dimension,
    delta: icon.srcRect.center
      .scale(icon.dstRect.dimension / icon.srcRect.dimension),
  };
}
