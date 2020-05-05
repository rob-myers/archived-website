import { hot } from 'react-hot-loader/root';
import withRedux from '@store/with-redux';
import { Session } from '@components/xterm/session';
import BabylonComponent from '@components/babylon/babylon';

const Demo1Page: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '50%' }}>
        <Session uid="demo-2" userKey="rob" />
      </div>
      <div style={{ width: '50%' }}>
        <BabylonComponent uid="babylon-1"/>
      </div>
    </div>
  );
};

export default hot(withRedux(Demo1Page));
