import { action } from '@ember/object';
import CardManipulator from "./card-manipulator";

export default class CardCreator extends CardManipulator {
  @action
  updateCardId(id) {
    this.card = this.data.createCard(id, 'isolated');
  }
}