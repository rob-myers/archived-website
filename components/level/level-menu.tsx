import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import css from './level.scss';
import { Act } from '@store/level.duck';

const LevelMenu: React.FC<Props> = ({ levelUid }) => {
  const state = useSelector(({ level: { instance } }) => instance[levelUid]);
  const dispatch = useDispatch();

  return (
    <section className={css.menu}>
      {
        state.mode === 'edit' && (
          <>
            <section className={css.editMenu}>
              <button
                className={classNames(css.button, {
                  [css.pressed]: state.cursorType === 'refined'
                })}
                onClick={(_e) => dispatch(Act.updateLevel(levelUid, {
                  cursorType: state.cursorType === 'refined' ? 'default' : 'refined',
                }))}
              >
                inner
              </button>
              <input
                className={css.filenameInput}
                placeholder="filename"
              />
            </section>
            <section className={css.mainMenu}>
              <button
                className={classNames(css.button, {
                  [css.pressed]: state.editMode === 'make'
                })}
                onClick={(_e) => dispatch(Act.updateLevel(levelUid, { editMode: 'make' }))}
              >
                make
              </button>
              <button
                className={classNames(css.button, {
                  [css.pressed]: state.editMode === 'meta'
                })}
                onClick={(_e) => dispatch(Act.updateLevel(levelUid, { editMode: 'meta' }))}
              >
                meta
              </button>
            </section>
          </>
        )
      }
    </section>
  );
};

interface Props {
  levelUid: string;
}

export default LevelMenu;