import SourceClass, { JSONAPISerializer } from '@orbit/jsonapi';

class CustomSerializer extends JSONAPISerializer {
  recordType(resourceType) {
    if (resourceType.indexOf('::') > -1) {
      return 'cardModel';
    } else {
      return super.recordType(resourceType);
    }
  }
}

export default {
  create(injections = {}) {
    injections.namespace = 'api';
    injections.host = 'http://localhost:3000';
    injections.name = 'remote';
    injections.SerializerClass = CustomSerializer;
    return new SourceClass(injections);
  },
};
