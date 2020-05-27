import { useDispatch, useSelector } from 'react-redux';
import { Act } from '@store/test.duck';
import TopMenu from '@components/top-menu/top-menu';
import css from './test.scss';
import Layout from '@components/layout/layout';

const Test: React.FC = () => {
  // const [count, setCount] = useState(0);
  const count = useSelector(({ test }) => test.count);
  const dispatch = useDispatch();

  return (
    <Layout>
      <TopMenu title="test" label="Welcome to the Test Page" />

      <section className={css.testSuite}>
        <div>{count}</div>
        <button onClick={() => dispatch(Act.testDecrement())}>-1</button>
        <button onClick={() => dispatch(Act.testIncrement())}>+1</button>
      </section>
    </Layout>
  );
};

export default Test;
