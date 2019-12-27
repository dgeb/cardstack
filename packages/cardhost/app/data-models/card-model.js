import { Model, attr } from 'ember-orbit';

export default class CardModel extends Model {
  @attr('string') name;
  @attr('string') title;
  @attr('string') body;
}
