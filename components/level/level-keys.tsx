import { useDispatch, useSelector } from 'react-redux';
import { Act } from '@store/level.duck';
import css from './level.scss';

const LevelKeys: React.FC<Props> = ({ levelUid, children}) => {
  const state = useSelector(({ level: { instance } }) => instance[levelUid]);
  const dispatch = useDispatch();

  return (
    <div
      className={css.keys}
      onKeyUp={(e) => {
        // console.log({ key: e.key, state });
        if (!state) return;
  
        switch (e.key) {
          case ' ': return state.editMode && e.shiftKey &&
            dispatch(Act.updateLevel(levelUid, {
              editMode: state.editMode === 'make' ? 'meta' : 'make',
            }));
          case '1': return state.editMode && dispatch(Act.updateLevel(levelUid, {
            cursorType: state.cursorType === 'default' ? 'refined' : 'default',
          }));
        }
      }}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

interface Props {
  levelUid: string;
}

export default LevelKeys;