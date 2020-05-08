import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import * as BABYLON from 'babylonjs';

import { Thunk } from '@store/level.duck';
import { Thunk as XTermThunk } from '@store/xterm.duck';
import { redact } from '@model/redux.model';
import usePageVisibility from '@components/page-visible/page-visible';
import css from './babylon.scss';
import { RootState } from '@store/reducer';

const BabylonComponent: React.FC<Props> = ({ uid }) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const pageVisible = usePageVisibility();
  const engine = useSelector(({ level: { instance } }: RootState) => instance[uid]?.engine);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      await dispatch(Thunk.createLevel({
        uid,
        canvas: redact(canvasEl.current!),
        osWorker: await dispatch(XTermThunk.ensureGlobalSetup({})),
      }));
    })();
    return () => dispatch(Thunk.destroyLevel({ uid }));
  }, [
    uid,
  ]);

  useEffect(() => {
    dispatch(Thunk.setLevelOption({ key: 'render', uid, shouldRender: pageVisible }));
  }, [pageVisible]);

  useEffect(() => {
    const resize = () => engine?.resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [engine]);

  return (
    <canvas
      width={300}
      height={300}
      ref={canvasEl}
      className={css.canvas}
    />
  );
};

interface Props {
  uid: string;
}

export default BabylonComponent;
