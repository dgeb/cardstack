import Component from '@glimmer/component';
import requirejsPolyfill from '@cardstack/requirejs-monaco-ember-polyfill';
import * as monaco from 'monaco-editor';
import { action } from '@ember/object';
import { restartableTask } from "ember-concurrency-decorators";
import { timeout } from "ember-concurrency";

/**
 * <CodeEditor> takes the following arguments:
 * @code the code to display, in string form, like 'let a = 2;'
 * @language 'javascript', 'json', etc.
 * @readOnly optional {{true}} or {{false}}. Defaults to true.
 * @updateCode optional action that is called when content of the editor changes. It receives the full code as an argument.
 * @editorReady optional action used for testing and animations. Fires
 * every time an editor has finished rendering.
 * @debounceMs optional number, rate limits how often updateCode is called. Default 500.
 * @validate optional action that should return a bool. Blocks calling updateCode if it returns false. Defaults to returning true.
 */

// without this polyfill, workers won't start due to a type error accessing
// a requirejs attribute. See the polyfill package readme for details.
requirejsPolyfill();

export default class CodeEditor extends Component {
  editor; // value is set by renderEditor
  editorIsReady = false; // set to true when the first code block renders

  constructor(...args) {
    super(...args);

    this.resizable = (this.args.resizable === true) ? true : false;
  }

  // Set default debounce in milliseconds.
  // This limits how often updateCode is called.
  get debounceMs() {
    let ms = this.args.debounceMs
    return (ms !== undefined) ? this.args.debounceMs : 500;
  }

  // Sets default resize interval check in milliseconds.
  // This limits how often updatedDimensions is called.
  get resizeCheckIntervalMs() {
    return this.args.resizeCheckIntervalMs || 2000;
  }

  // readOnly defaults to true
  get readOnly() {
    return (this.args.readOnly === false) ? false : true;
  }

  // validate defaults to returning true
  get validate() {
    return this.args.validate || function() { return true };
  }

  get updateCode() {
    return this.args.updateCode || function() {};
  }

  updateDimensions(opts) {
    this.editor.layout(opts);
  }

  @action
  editorReady() {
    if (!this.editorIsReady) {
      this.editorIsReady = true;
      if (this.args.editorReady) {
        this.args.editorReady()
      }
    }
  }

  @action
  renderEditor(el) {
    // Every time a new editor is created, this fires for the new editor
    // plus all existing editors on the page. If there are 4 editors on
    // the page, it will fire 1 + 2 + 3 + 4 times
    monaco.editor.onDidCreateEditor(this.editorReady)
    // This is called when the containing div has been rendered.
    // `create` constructs a code editor and inserts it into the DOM.
    // el is the element that {{did-insert}} was used on.
    let codeModel = monaco.editor.createModel(this.args.code, this.args.language)
    if (!this.resizable) {
      let height = codeModel.getLineCount() * 20;
      el.style.height = height.toString() + "px";
    }
    let editor = monaco.editor.create(el, {
      model: codeModel,
      theme: 'vs-dark',
      readOnly: this.readOnly,
      minimap: { enabled: false },
      wordWrap: "on",
      scrollBeyondLastLine: false,
      wrappingIndent: 'same'
    })
    // Whenever the code block's text changes, onUpdateCode will be called.
    editor.onDidChangeModelContent(this.onUpdateCode)
    // Save editor instance locally, so we can reference it in other methods
    this.editor = editor;

    if (this.resizable) {
      this.startResizeWatcher.perform(el);
    }
  }

  @action
  onUpdateCode() {
    // called whenever the code in the editor changes
    this.debounceAndUpdate.perform()
  }

  @restartableTask
  * debounceAndUpdate() {
    // This is a rate limiter so that fast typing doesn't wreck things.
    yield timeout(this.debounceMs)
    let code = this.editor.getValue() // get the current text contents of the code editor
    if (this.validate(code)) {
      this.updateCode(code);
    }  
  }

  @restartableTask
  * startResizeWatcher (wrapper) {
    wrapper.style['padding-bottom'] = '20px';

    let { offsetWidth, offsetHeight } = wrapper;

    while (true) {
      yield timeout(this.resizeCheckIntervalMs);

      let { offsetWidth: newOffsetWidth, offsetHeight: newOffsetHeight } = wrapper;
      if (offsetHeight !== newOffsetHeight || offsetWidth !== newOffsetWidth) {
        offsetHeight = newOffsetHeight;
        offsetWidth = newOffsetWidth;
        let editorHeight = offsetHeight - 15; // So that the editor doesn't cover the resize corner
        this.updateDimensions({height: editorHeight, width: offsetWidth});
      }
    }
  }
}
