import { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import css from './babylon.scss';
import { Thunk } from '@store/level.duck';
import { redact } from '@model/redux.model';

const BabylonComponent: React.FC<Props> = ({
  uid,
}) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(Thunk.createLevel({ uid, canvas: redact(canvasEl.current!) })).then(
      /** Level created */
    );
    return () => {
      dispatch(Thunk.destroyLevel({ uid }));
    };
  }, [
    uid
  ]);

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
