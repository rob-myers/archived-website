import { Rect2 } from '@model/rect2.model';
import { redact, Redacted } from '@store/redux.model';
import { Poly2 } from '@model/poly2.model';

type NavElKey = 'content' | 'nav-poly' | 'spawn';

export function getNavElemId(uid: string, key: NavElKey) {
  switch (key) {
    case 'content': return `nav-root-${uid}`;
    case 'nav-poly': return `nav-poly-${uid}`;
    case 'spawn': return `nav-spawn-${uid}`;
  }
}

export function traverseDom(el: HTMLElement, act: (el: HTMLElement) => void) {
  act(el);
  for (const childEl of el.children) {
    traverseDom(childEl as HTMLElement, act);
  }
}

export const observeOpts: MutationObserverInit = {
  attributes: true,
  childList: true,
  subtree: true,
};

export const defaultNavOutset = 10;

export const defaultNavigableClass = 'navigable';

export function createNavDomState(uid: string): NavDomState {
  return {
    key: uid,
    elemId: getNavElemId(uid, 'content'),
    navOutset: defaultNavOutset,
    spawns: [],
    worldBounds: redact(Rect2.from()),
    navigable: [],
    refinedNav: [],
  };
}

export interface NavDomState {
  /** uid. */
  key: string;
  elemId: string;
  /** Optional custom outset; overrides default. */
  navOutset?: number;
  /** Optional custom class name for holes. */
  navHoleClass?: string;
  spawns: NavSpawnState[];
  worldBounds: Redacted<Rect2>;
  /** Navigable multipolygon. */
  navigable: Redacted<Poly2>[];
  /** Refined multipolygon for pathfinding. */
  refinedNav: Redacted<Poly2>[];
}

interface NavSpawnState {
  key: string;
  elemId: string;
  bounds: Redacted<Rect2>;
}

export interface NavDomMeta {
  key: string;
  justHmr: boolean;
  updating: boolean;
}

export function createNavDomMetaState(uid: string): NavDomMeta {
  return {
    key: uid,
    justHmr: false,
    updating: false,
  };
}
