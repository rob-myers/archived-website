import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutPanelMeta } from '@model/layout/layout.model';
import { CustomPanelMetaKey } from '@model/layout/example-layout.model';
import { isAppPanel, isFilePanel } from '@model/code/dev-env.model';
import { Act } from '@store/dev-env.duck';
import DevPanelMenu from './dev-panel-menu';
import css from './dev-panel.scss';

const DevEditor = dynamic(import('@components/dev-env/dev-editor'), { ssr: false });
const DevApp = dynamic(import('@components/dev-env/dev-app'), { ssr: false });

const DevPanel: React.FC<Props> = ({ panelKey, panelMeta }) => {
  const [failed, setFailed] = useState(false);
  const initialized = useSelector(({ layout: { panel } }) =>
    !!(panel[panelKey]?.initialized));
  const devMeta = useSelector(({ devEnv: { panelToMeta } }) =>
    panelKey in panelToMeta ? panelToMeta[panelKey] : null);
  
  const dispatch = useDispatch();

  /**
   * When panel initialized create DevPanelMeta in devEnv.panelToMeta.
   * We drive the rendering using the latter meta.
   * This permits us to change the contents of the panel.
   */
  useEffect(() => {
    if (initialized) {
      if (panelMeta && isFilePanel(panelMeta)) {
        dispatch(Act.createFilePanelMeta({ filename: panelMeta.filename, panelKey }));
      } else if (panelMeta && isAppPanel(panelMeta)) {
        dispatch(Act.createAppPanelMeta({ panelKey }));
      } else {
        setFailed(true);
      }
    }
    return () => initialized && dispatch(Act.forgetPanelMeta({ panelKey }));
  }, [initialized]);

  return devMeta ? (
    <>
      <DevPanelMenu panelKey={panelKey} />
      {devMeta.panelType === 'file' && (
        <DevEditor panelKey={panelKey} filename={devMeta.filename} />
      ) || (
        <DevApp panelKey={panelKey} />
      )}
      {failed && (
        <div className={css.unsupportedPanel}>
          {`Unsupported panel '${panelKey}' with meta '${JSON.stringify(panelMeta)}'`}
        </div>
      )}
    </>
  ) : null;
};

interface Props {
  panelKey: string;
  panelMeta?: LayoutPanelMeta<CustomPanelMetaKey>;
}

export default DevPanel;
