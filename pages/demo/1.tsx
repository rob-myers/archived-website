import { hot } from 'react-hot-loader/root';
import withRedux from '@store/with-redux';
import { Session } from '@components/xterm/session';
import BabylonComponent from '@components/babylon/babylon';

const Demo1Page: React.FC = () => {
  return (
    <div>
      <Session uid="demo-2" userKey="user" />
      <BabylonComponent uid="babylon-1"/>
    </div>
  );
};

export default hot(withRedux(Demo1Page));
