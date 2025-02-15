import BaseEditor from './base-editor';
import { action } from '@ember/object';
export default class BelongsToEditor extends BaseEditor {

  constructor(...args) {
    super(...args);

    if (this.args.field && this.args.field.value) {
      this.fieldValue = this.args.field.value.name
    }
  }

  @action
  updateFieldValue(value) {
    this.fieldValue = value;
    this.args.setFieldValue(`local-hub::${value}`);
  }
}