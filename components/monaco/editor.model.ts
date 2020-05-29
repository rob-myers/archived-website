import { IMonacoEditorOptions } from '@model/monaco/monaco.model';

export interface IEditorProps {
  /**
   * Defaults to `default-editor`.
   */
  editorKey?: string;
  /**
   * Defaults to `default-model`.
   */
  modelKey?: string;
  /**
   * Editor height.
   * Changing this prop should not re-create the editor, but won't update layout.
   */
  height?: number | string;

  /**
   * Editor width.
   * Changing this prop should not re-create the editor, but won't update layout.
   */
  width?: number | string;

  /**
   * Class for the div containing the editor.
   * Can be changed without re-creating the editor.
   */
  className?: string;

  /**
   * Initial code to edit.
   * WARNING: Changing this will re-create the editor. (For this reason, the
   * editor should NOT be used as a controlled component.)
   */
  code?: string;

  /**
   * Editor code language.
   * WARNING: Changing this will re-create the editor.
   */
  language?: string;

  /** 
   * Name for the fake file e.g. `file:///main.tsx`.
   * WARNING: Changing this will re-create the editor.
   */
  filename: string;

  /**
   * Label for the editor for screen reader users.
   * WARNING: Changing this will re-create the editor.
   */
  ariaLabel?: string;

  /**
   * Options for creating the editor.
   * WARNING: Changing this will re-create the editor.
   */
  editorOptions?: IMonacoEditorOptions;

  /**
   * Callback to notify when the text changes.
   */
  onChange?: () => void;

  /**
   * Debounce `onChange` calls by this many milliseconds, or 0 to disable.
   * Can be changed without re-creating the editor.
   * @defaultvalue 1000
   */
  debounceMs?: number;

  theme?: string;
}