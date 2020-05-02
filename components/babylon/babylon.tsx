import { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as BABYLON from 'babylonjs';
import { createDemoScene } from '@model/level/babylon.model';
import css from './babylon.scss';
import { Thunk } from '@store/level.duck';

const BabylonComponent: React.FC<Props> = ({
  uid,
}) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const engine = useRef<BABYLON.Engine>();
  const scene = useRef<BABYLON.Scene>();
  const dispatch = useDispatch();

  useEffect(() => {
    // Create scene
    engine.current = new BABYLON.Engine( canvasEl.current!, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    scene.current = createDemoScene(canvasEl.current!, engine.current);
    engine.current.runRenderLoop(() => scene.current!.render());

    dispatch(Thunk.createLevel({ uid })).then(
      /** Level created */
    );

    return () => {
      engine.current!.stopRenderLoop();
      dispatch(Thunk.destroyLevel({ uid }));
    };
  }, []);
  // }, [uid]);

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
