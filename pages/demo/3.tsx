import { hot } from 'react-hot-loader/root';
import withRedux from '@store/with-redux';
import BabylonComponent from '@components/babylon/babylon';

const Demo3Page: React.FC = () => {
  return (
    <div>
      <BabylonComponent uid="babylon-1"/>
    </div>
  );
};

export default hot(withRedux(Demo3Page));
