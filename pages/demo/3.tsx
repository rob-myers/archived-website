import { hot } from 'react-hot-loader/root';
import withRedux from '@store/with-redux';

const Demo3Page: React.FC = () => {
  return (
    <div style={{ width: '100%', height: 60 * 8 }}>
      Babylon goes here
    </div>
  );
};

export default hot(withRedux(Demo3Page));
