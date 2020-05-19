import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as monaco from 'monaco-editor';
import { LanguageServiceDefaultsImpl as TypescriptDefaults } from '@model/monaco/monaco-typescript.d';
import { ITsxEditorProps } from './tsx-editor.model';
import { transpileAndEval } from '@model/monaco/transpile';
import { IMonacoTextModel, ICompilerOptions, IPackageGroup } from '@model/monaco';
import { SUPPORTED_PACKAGES } from '@model/monaco/supported-packages';
import { IEditorProps } from './editor.model';
import { getWindow } from '@model/dom.model';
import Editor from './editor';

const typescript = monaco.languages.typescript;
const typescriptDefaults = typescript.typescriptDefaults as TypescriptDefaults;

const filePrefix = 'file:///';
const filename = `${filePrefix}main.tsx`;

/**
 * Wrapper for rendering a Monaco instance and also
 * transpiling/eval-ing the React example code inside.
 */
const TsxEditor: React.FunctionComponent<ITsxEditorProps> = ({
  editorProps,
  onTransformFinished,
  compilerOptions,
  supportedPackages = SUPPORTED_PACKAGES,
}) => {
  const backupModelRef = React.useRef<IMonacoTextModel>();
  const modelRef = editorProps.modelRef || backupModelRef;

  // Load the globals before loading the editor (otherwise there will be an error executing the
  // example code because the globals it depends on aren't defined)
  const hasLoadedGlobals = useGlobals(supportedPackages);

  // Set up compiler options
  useCompilerOptions(compilerOptions);

  // Set up type checking after globals are loaded
  const hasLoadedTypes = useTypes(supportedPackages, hasLoadedGlobals);

  // Store latest onChange in ref, ensuring latest values without forced re-render
  const onChangeRef = React.useRef<IEditorProps['onChange']>();
  onChangeRef.current = (text: string) => {
    if (editorProps.onChange) {
      // If the consumer provided an additional onChange, call that too
      editorProps.onChange(text);
    }
    transpileAndEval(modelRef.current!, supportedPackages).then(onTransformFinished);
  };

  // After type checking and globals are set up, call onChange to transpile
  React.useEffect(() => {
    if (hasLoadedTypes && modelRef.current) {
      onChangeRef.current!(modelRef.current.getValue());
    }
  }, [onChangeRef, hasLoadedTypes, modelRef.current]);

  return (
    <Editor
      {...editorProps}
      filename={filename}
      modelRef={modelRef}
      // Don't track changes until types have loaded
      onChange={hasLoadedTypes ? onChangeRef.current : undefined}
    />
  );
};

function useGlobals(supportedPackages: IPackageGroup[]): boolean {
  const [hasLoadedGlobals, setHasLoadedGlobals] = React.useState(false);
  React.useEffect(() => {
    setHasLoadedGlobals(false);
    const win = getWindow<{ [key: string]: any }>();
    if (win) {
      !win.React && (win.React = React);
      !win.ReactDOM && (win.ReactDOM = ReactDOM);

      Promise.all(
        supportedPackages.map(group => {
          if (!win[group.globalName]) {
            return new Promise<any>(resolve => {
              // handle either promise or callback function
              const globalResult = group.loadGlobal(resolve);
              if (globalResult && (globalResult as PromiseLike<any>).then) {
                globalResult.then(resolve);
              }
            }).then((globalModule: any) => (win[group.globalName] = globalModule));
          }
        }),
      ).then(() => setHasLoadedGlobals(true));
    }

  }, [supportedPackages]);
  return hasLoadedGlobals;
}

function useCompilerOptions(compilerOptions: ICompilerOptions | undefined): void {
  React.useEffect(() => {
    const oldCompilerOptions = typescriptDefaults.getCompilerOptions();
    typescriptDefaults.setCompilerOptions({
      // The compiler options used here generally should *not* be strict, to make quick edits easier
      experimentalDecorators: true,
      preserveConstEnums: true,
      // implicit global `this` usage is almost always a bug
      noImplicitThis: true,
      // Mix in provided options
      ...compilerOptions,
      // These options are essential to making the transform/eval and types code work (no overriding)
      allowNonTsExtensions: true,
      target: typescript.ScriptTarget.ES2015,
      jsx: typescript.JsxEmit.React,
      module: typescript.ModuleKind.ESNext,
      baseUrl: filePrefix,
      // This is updated after types are loaded, so preserve the old setting
      paths: oldCompilerOptions.paths,
    });
  }, [compilerOptions]);
}

function useTypes(supportedPackages: IPackageGroup[], isReady: boolean) {
  const [hasLoadedTypes, setHasLoadedTypes] = React.useState(false);

  React.useEffect(() => {
    if (!isReady) {
      return;
    }
    // Initially disable type checking
    typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true });
    // Load types and then turn on full type checking
    loadTypes(supportedPackages).then(() => {
      typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false });
      setHasLoadedTypes(true);
    });
  }, [supportedPackages, isReady]);

  return hasLoadedTypes;
}

/**
 * Load types for React and any other packages.
 */
function loadTypes(supportedPackages: IPackageGroup[]): Promise<void> {
  const promises: Promise<void>[] = [];
  const typesPrefix = `${filePrefix}node_modules/@types`;

  // React types must be loaded first (don't use import() to avoid potential bundling issues)
  promises.push(
    new Promise<void>(resolve =>
      require.ensure([], require => {
        // raw-loader 0.x exports a single string, and later versions export a default.
        // The package.json specifies 0.x, but handle either just in case.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const result: string | { default: string } = require('!raw-loader!@types/react/index.d.ts');
        typescriptDefaults.addExtraLib(
          typeof result === 'string' ? result : result.default,
          `${typesPrefix}/react/index.d.ts`,
        );
        resolve();
      }),
    ),
  );

  // Load each package and add it to TS (and save path mappings to add to TS later)
  const pathMappings: { [path: string]: string[] } = {};
  for (const group of supportedPackages) {
    for (const pkg of group.packages) {
      const { packageName, loadTypes } = pkg;
      // Get the pretend @types package name
      // (for a scoped package like @uifabric/utilities, this will be uifabric__utilities)
      const scopedMatch = packageName.match(/^@([^/]+)\/(.*)/);
      const typesPackageName = scopedMatch ? `${scopedMatch[1]}__${scopedMatch[2]}` : packageName;

      // Call the provided loader function
      promises.push(
        Promise.resolve(loadTypes()).then(contents => {
          const indexPath = `${typesPrefix}/${typesPackageName}/index`;
          // This makes TS automatically find typings for package-level imports
          typescriptDefaults.addExtraLib(contents, `${indexPath}.d.ts`);
          // But for deeper path imports, we likely need to map them back to the root index file
          // (do still include '*' as a default in case the types include module paths--
          // api-extractor rollups don't do this, but other packages' typings might)
          // https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
          pathMappings[packageName + '/lib/*'] = ['*', indexPath];
        }),
      );
    }
  }

  return Promise.all(promises).then(() => {
    // Add the path mappings
    typescriptDefaults.setCompilerOptions({
      ...typescriptDefaults.getCompilerOptions(),
      paths: pathMappings,
    });
  });
}

export default TsxEditor;
