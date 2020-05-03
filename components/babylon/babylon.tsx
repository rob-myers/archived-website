import { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as BABYLON from 'babylonjs';
import { Thunk } from '@store/level.duck';
import { redact } from '@model/redux.model';
import usePageVisibility from '@components/page-visible/page-visible';
import css from './babylon.scss';

const BabylonComponent: React.FC<Props> = ({ uid }) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const pageVisible = usePageVisibility();

  useEffect(() => {
    dispatch(Thunk.createLevel({ uid, canvas: redact(canvasEl.current!) }));
    dispatch(Thunk.addCuboid({ // TEST
      levelUid: uid,
      bounds: new BABYLON.Vector3(1, 1, 1),
      meshName: 'my-test-cube',
      position: new BABYLON.Vector3(0, 3, 0),
    }));
    return () => {
      dispatch(Thunk.destroyLevel({ uid }));
    };
  }, [
    uid
  ]);

  useEffect(() => {
    dispatch(Thunk.setLevelOption({ key: 'render', uid, shouldRender: pageVisible }));
  }, [pageVisible]);

  return (
    <canvas
      ref={canvasEl}
      className={css.canvas}
    />
  );
};

interface Props {
  uid: string;
}

export default BabylonComponent;
