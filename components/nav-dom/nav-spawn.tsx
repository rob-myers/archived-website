import { getNavElemId } from './nav.model';

const NavSpawn: React.FC<Props> = ({ uid, className }) => {
  const spawnId = getNavElemId(uid, 'spawn');
  return (
    <div
      id={spawnId}
      className={className}
    />
  );
};

interface Props {
  uid: string;
  className?: string;
}

export default NavSpawn;
