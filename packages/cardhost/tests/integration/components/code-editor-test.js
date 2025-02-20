import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, waitUntil } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | code-editor', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('editorIsReady', false)
    let editorIsReady = false
    this.set('editorReady', () => {
      editorIsReady = true;
    })

    await render(hbs`<CodeEditor @editorReady={{action this.editorReady}} @code="card" />`);
    await waitUntil(() => {
      return editorIsReady;
    }, {timeout: 10000})
    let lineNumber = '1'
    assert.dom('.cardhost-monaco-container').hasText(lineNumber + 'card') // should be 1card
  });
});
