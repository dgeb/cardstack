import { module, test } from 'qunit';
import { click, fillIn, find, visit, currentURL, triggerEvent, focus } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures'
import { addField, setCardId, createCards, saveCard, dragAndDropNewField, removeField } from '@cardstack/test-support/card-ui-helpers';
import { setupMockUser, login } from '../helpers/login';

const card1Id = 'millenial-puppies';
const qualifiedCard1Id = `local-hub::${card1Id}`;

const scenario = new Fixtures({
  create(factory) {
    setupMockUser(factory);
  },
  destroy() {
    return [
      { type: 'cards', id: qualifiedCard1Id },
    ];
  }
});

module('Acceptance | card create', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);
  hooks.beforeEach(function () {
    this.owner.lookup('service:data')._clearCache();
  });

  test('new cards get a default id', async function(assert) {
    await login();
    await visit('/cards/new');

    assert.equal(currentURL(), '/cards/new');

    await saveCard('creator');

    assert.ok(currentURL().match(/\/cards\/new-card-[0-9]+\/schema/));
  });

  test('card element is selected on initial render', async function(assert) {
    await login();
    await visit('/cards/new');

    assert.equal(currentURL(), '/cards/new');

    assert.dom('[data-test-card-renderer-isolated]').hasClass('selected');
  });

  test("changing a card's id does not clear the card fields", async function(assert) {
    await login();
    await visit('/cards/new');

    await addField('title', 'string', true);
    await setCardId(card1Id);
    assert.deepEqual([...document.querySelectorAll(`[data-test-isolated-card="${card1Id}"] [data-test-field]`)].map(i => i.getAttribute('data-test-field')),
      ['title']);
  });

  test('creating a card', async function(assert) {
    await login();
    await visit('/cards/new');

    assert.equal(currentURL(), '/cards/new');

    assert.dom('.card-renderer-isolated--header').hasTextContaining('new-card-');
    assert.dom('[data-test-internal-card-id]').hasTextContaining('local-hub::new-card-');

    await createCards({
      [card1Id]: [
        ['title', 'string', true],
        ['body', 'string', false],
        ['author', 'related card', true],
        ['reviewers', 'related cards', true]
      ]
    });

    assert.equal(currentURL(), `/cards/${card1Id}`);
    await visit(`/cards/${card1Id}/schema`);
    assert.dom('.card-renderer-isolated--header').hasText('millenial-puppies');
    assert.dom('[data-test-internal-card-id]').hasText('local-hub::millenial-puppies');

    await click('[data-test-field="title"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="title"]').hasClass('selected');
    assert.dom('[data-test-field="title"] [data-test-field-renderer-type]').hasText('@cardstack/core-types::string');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="embedded"] input').isChecked();

    await click('[data-test-field="body"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="body"]').hasClass('selected');
    assert.dom('[data-test-field="body"] [data-test-field-renderer-type]').hasText('@cardstack/core-types::string');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="embedded"] input').isNotChecked();

    await click('[data-test-field="author"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="author"]').hasClass('selected');
    assert.dom('[data-test-field="author"] [data-test-field-renderer-type]').hasText('@cardstack/core-types::belongs-to');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="embedded"] input').isChecked();

    await click('[data-test-field="reviewers"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="reviewers"]').hasClass('selected');
    assert.dom('[data-test-field="reviewers"] [data-test-field-renderer-type]').hasText('@cardstack/core-types::has-many');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="embedded"] input').isChecked();

    await focus('[data-test-card-renderer-isolated]');
    assert.dom('.card-renderer-isolated--header').hasText('millenial-puppies');
    assert.dom('[data-test-internal-card-id]').hasText('local-hub::millenial-puppies');
    // TODO: figure out why having the following assertions before the line above ^^^ causes a test failure
    assert.dom('[data-test-card-renderer-isolated]').hasClass('selected');
    assert.dom('.field-renderer').doesNotHaveClass('selected');

    let cardJson = find('[data-test-code-block]').getAttribute('data-test-code-block')
    let card = JSON.parse(cardJson);
    assert.equal(card.data.attributes.title, undefined);
    assert.equal(card.data.attributes.body, undefined);
    assert.equal(card.data.relationships.author, undefined);
    assert.deepEqual(card.data.relationships.reviewers, undefined);
  });

  test(`selecting a field`, async function(assert) {
    await login();
    await visit('/cards/new');

    await setCardId(card1Id);
    await addField('title', 'string', true);
    await addField('body', 'string', false);

    await click('[data-test-field="title"]');

    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('title');

    await fillIn('[data-test-right-edge] [data-test-schema-attr="name"] input', 'subtitle');
    await triggerEvent(`[data-test-right-edge] [data-test-schema-attr="name"] input`, 'keyup');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('subtitle');

    await fillIn('[data-test-right-edge] [data-test-schema-attr="label"] input', 'Subtitle');
    await triggerEvent(`[data-test-right-edge] [data-test-schema-attr="label"] input`, 'keyup');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('Subtitle');

    await fillIn('[data-test-right-edge] [data-test-schema-attr="instructions"] textarea', 'This is the subtitle');
    await triggerEvent(`[data-test-right-edge] [data-test-schema-attr="instructions"] textarea`, 'keyup');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="instructions"] textarea').hasValue('This is the subtitle');

    await click('[data-test-field="body"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="body"]').hasClass('selected');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('body');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('body');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="instructions"] textarea').hasValue('');

    await click('[data-test-field="subtitle"] [data-test-field-schema-renderer]');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="subtitle"]').hasClass('selected');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('subtitle');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('Subtitle');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="instructions"] textarea').hasValue('This is the subtitle');

    await dragAndDropNewField('string');
    assert.dom('[data-test-isolated-card="millenial-puppies"] [data-test-field="new-field-2"]').hasClass('selected');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('new-field-2');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('new-field-2');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="instructions"] textarea').hasValue('');
  });

  test(`renaming a card's field`, async function(assert) {
    await login();
    await visit('/cards/new');

    await setCardId(card1Id);
    await addField('title', 'string', true);

    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('title');
    await fillIn('[data-test-schema-attr="name"] input', 'subtitle');
    await triggerEvent('[data-test-schema-attr="name"] input', 'keyup');

    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('subtitle');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('subtitle');

    await saveCard('creator', card1Id);

    assert.equal(currentURL(), `/cards/${card1Id}/schema`);

    await visit(`/cards/${card1Id}`);
    assert.dom('[data-test-field="subtitle"] [data-test-string-field-viewer-label]').hasText('subtitle');
    assert.dom('[data-test-field="title"]').doesNotExist();

    await visit(`/cards/${card1Id}/edit`);
    assert.dom('[data-test-field="subtitle"] [data-test-string-field-editor-label]').hasText('subtitle');
    assert.dom('[data-test-field="title"]').doesNotExist();

    await visit(`/cards/${card1Id}/schema`);
    assert.dom('[data-test-field="subtitle"] [data-test-field-renderer-label]').hasText('subtitle');
    await click('[data-test-field="subtitle"]');

    assert.dom('[data-test-right-edge] [data-test-schema-attr="name"] input').hasValue('subtitle');
    assert.dom('[data-test-right-edge] [data-test-schema-attr="label"] input').hasValue('subtitle');
  });

  test(`removing a field from a card`, async function(assert) {
    await login();
    await visit('/cards/new');

    await setCardId(card1Id);
    await addField('title', 'string', true);

    await removeField('title');

    assert.dom('.cardhost-right-edge-panel [data-test-field]').doesNotExist();
  });

  test(`removing a field from a card that has an empty name`, async function(assert) {
    await login();
    await visit('/cards/new');

    await setCardId(card1Id);
    await addField('', 'string', true);
    assert.dom('[data-test-isolated-card] [data-test-field').exists({ count: 1 });

    await click(`[data-test-isolated-card] [data-test-field-renderer-remove-btn]`);
    assert.dom('[data-test-isolated-card] [data-test-field').doesNotExist();
  });

  test('can add a field at a particular position', async function(assert) {
    await login();
    await visit('/cards/new');

    assert.equal(currentURL(), '/cards/new');

    await setCardId(card1Id);
    await addField('title', 'string', true);
    await addField('body', 'string', false, 1);
    await addField('author', 'string', false, 1);

    assert.deepEqual([...document.querySelectorAll(`[data-test-isolated-card="${card1Id}"] [data-test-field]`)].map(i => i.getAttribute('data-test-field')),
    ['title', 'author', 'body']);

    await saveCard('creator', card1Id);

    await visit(`/cards/${card1Id}`);
    assert.deepEqual([...document.querySelectorAll('[data-test-field]')].map(i => i.getAttribute('data-test-field')),
      ['title', 'author', 'body']);
    let cardJson = find('[data-test-code-block]').getAttribute('data-test-code-block')
    let card = JSON.parse(cardJson);
    assert.deepEqual(card.data.relationships.fields.data, [
      { type: 'fields', id: 'title' },
      { type: 'fields', id: 'author' },
      { type: 'fields', id: 'body' },
    ]);
  });
});
