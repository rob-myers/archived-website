import { useSelector } from 'react-redux';
import ConnectedLayout from '@components/golden-layout/connected-layout';
import css from './dev.scss';

const menuHeightPx = 25;

const DevEnvPage: React.FC = () => {
  const loadingMonaco = useSelector(({ worker: { monacoLoading } }) => monacoLoading);
  const closable = useSelector(({ layout: { panel } }) => Object.keys(panel).length > 1);

  return (
    <div className={css.root}>
      <div className={css.menu} style={{ height: menuHeightPx }}>
        Menu goes here
      </div>
      <ConnectedLayout
        width="100vw"
        height={`calc(100vh - ${menuHeightPx}px)`}
        disabled={loadingMonaco}
        closable={closable}
      />
    </div>
  );
};

export default DevEnvPage;