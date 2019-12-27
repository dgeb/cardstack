import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import ENV from '@cardstack/cardhost/config/environment';
import { hash } from 'rsvp';

const { environment, cardTemplates = [] } = ENV;

export default class IndexRoute extends Route {
  @service data;
  @service dataCoordinator;

  async model() {
    if (environment === 'development') {
      // prime the store with seed models
      await this.store.findRecord('card', 'local-hub::why-doors', {
        sources: { remote: { settings: { params: { format: 'embedded' } } } },
        // TODO:remove sources: { remote: { settings: { params: { format: 'isolated' } } } },
      });
      // TODO:remove await this.data.getCard('local-hub::why-doors', 'isolated');
    }

    return await hash({
      // TODO need to refactor this once we have search support for cards.
      // For now we're just hardcoding a list of templates to load, and pretending
      // that the local store is the catalog.
      catalog: this.store.peekRecords('card'), // this.data.allCardsInStore(),
      // TODO:remove templates: Promise.all(cardTemplates.map(i => this.data.getCard(i, 'embedded'))),
      templates: Promise.all(
        cardTemplates.map(i =>
          this.store.findRecord('card', i, {
            sources: { remote: { settings: { params: { format: 'embedded' } } } },
          })
        )
      ),
    });
  }

  @action
  refreshModel() {
    this.refresh();
  }
}
