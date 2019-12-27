import { Model, attr, hasOne, hasMany } from 'ember-orbit';

const CARD_ID_DELIM = '::';

export default class Card extends Model {
  @attr('array') fieldOrder;
  @attr('string') isolatedCss;
  @attr('string') embeddedCss;
  @attr('object') metadataSummary;
  @attr('array') adoptionChain;
  @hasMany('field') fields;
  @hasOne('card') adoptedFrom;
  @hasOne('cardModel') model;
  @attr('string') title;
  @attr('string') body;

  get repository() {
    return this.id.split(CARD_ID_DELIM)[0];
  }

  get name() {
    return this.id.split(CARD_ID_DELIM)[1];
  }

  get format() {
    return 'embedded';
  }

  get isolatedFields() {
    if (this.loadedFormat === 'embedded') {
      throw new Error(
        `Cannot get isolatedFields for card '${this.id}' because card has not loaded isolated format. Invoke card.load() first, before getting isolatedFields`
      );
    }

    const fields = this.fields.map(f => {
      const { id, type, fieldType, caption, searchable, editorComponent, editorOptions } = f;

      let v = {
        id,
        type,
        label: this.metadataSummary[f.id].label,
        value: this.metadataSummary[f.id].value,
        fieldType,
        caption,
        searchable,
        editorComponent,
        editorOptions,
      };

      return v;
    });

    console.log('isolatedFields', fields);

    return fields;
  }

  validate() {
    const { id, adoptedFrom } = this;

    if (id.split(CARD_ID_DELIM).length !== 2) {
      throw new Error(
        `The card ID '${id}' format is incorrect. The card ID must be formatted as 'repository::card-name'`
      );
    }

    // TODO: `isNew` doesn't yet exist
    if (adoptedFrom && adoptedFrom.isNew) {
      throw new Error(
        `Cannot create card '${id}', the card you are trying to adopt '${adoptedFrom.id}' has not been saved yet. Please save the card '${adoptedFrom.id}' first.`
      );
    }
  }
}
