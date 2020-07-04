import { useSelector } from 'react-redux';
import { panelKeyToAppElId, panelKeyToEditorKey, filenameToModelKey } from '@model/code/dev-env.model';
import Editor from '@components/monaco/editor';
import css from './dev-app.scss';

const DevApp: React.FC<Props> = ({ panelKey }) => {
  const monacoLoaded = useSelector(({ editor: { monacoLoaded } }) => monacoLoaded);

  return (
    <>
      {/* App is mounted into this div */}
      <div id={panelKeyToAppElId(panelKey)} style={{ height: '100%' }}>
        {/* This placeholder is removed via app mount */}
        <div className={css.appNotMounted}>
          App not mounted
        </div>
      </div>

      {!monacoLoaded && (
        // Ensure monaco is bootstrapped via hidden editor.
        <div className={css.hiddenMonacoEditor}>
          <Editor
            editorKey={panelKeyToEditorKey(panelKey)}
            modelKey={filenameToModelKey('_bootstrap.ts')}
            filename={'_bootstrap.ts'}
          />
        </div>
      )}
    </>
  );
};

interface Props {
  panelKey: string;
}

export default DevApp;