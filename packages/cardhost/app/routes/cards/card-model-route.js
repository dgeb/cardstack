import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class CardModelRoute extends Route {
  @service data;

  async model({ id }) {
    // TODO:remove return await this.data.getCard(`local-hub::${id}`, 'isolated');
    return this.store.findRecord('card', `local-hub::${id}`, {
      sources: { remote: { settings: { params: { format: 'isolated' } } } },
    });
  }
}
