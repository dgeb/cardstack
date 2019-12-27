import { Model, attr, hasOne, hasMany } from 'ember-orbit';

export default class Field extends Model {
  @attr('string') fieldType;
  @attr('string') caption;
  @attr('string') searchable;
  @attr('string') editorComponent;
  @attr('string') editorOptions;
  @attr('string') inlineEditorComponent;
  @attr('string') inlineEditorOptions;
  @attr('boolean') isMetadata;
  @attr('boolean') neededWhenEmbedded;
  @attr('string') instructions;
}
