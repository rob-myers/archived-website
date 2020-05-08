import { hot } from 'react-hot-loader/root';
import withRedux from '@store/with-redux';
import { Session } from '@components/xterm/session';
import BabylonComponent from '@components/babylon/babylon';

const Demo1Page: React.FC = () => {
  const levelKey = 'demo-1';
  const LEVEL_DEVICE = `/dev/level-${levelKey}`;

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '50%' }}>
        <Session
          uid="demo-1"
          userKey="rob"
          env={{ LEVEL_DEVICE }}
        />
      </div>
      <div style={{ width: '50%' }}>
        <BabylonComponent uid={levelKey} />
      </div>
    </div>
  );
};

export default hot(withRedux(Demo1Page));
