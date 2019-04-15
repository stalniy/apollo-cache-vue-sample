import Vue from 'vue';
import { InMemoryCache, ObjectCache } from 'apollo-cache-inmemory';

class VueStore extends ObjectCache {
  constructor(store) {
    super(store)
    Vue.util.defineReactive(this, 'data', this.data)
  }

  set(dataId, value) {
    Vue.set(this.data, dataId, value);
  }

  delete(dataId) {
    this.set(dataId, void 0);
  }
}

class OptimisticCacheLayer extends VueStore {
  constructor(optimisticId, parent, transaction) {
    super()
    this.optimisticId = optimisticId;
    this.parent = parent;
    this.transaction = transaction;
  }

  toObject() {
    return Object.assign({}, this.parent.toObject(), this.data);
  }

  get(dataId) {
    return dataId in this.data
      ? super.get(dataId)
      : this.parent.get(dataId);
  }
}

export default class ApolloVueCache extends InMemoryCache {
  constructor({ data, ...config }) {
    super({ ...config, resultCaching: false })
    this.data = new VueStore()
    this._initialState = data
    Vue.util.defineReactive(this, 'optimisticData', this.data)

    if (data) {
      this.writeData({ data })
    }
  }

  reset() {
    return super.reset()
      .then(() => {
        if (this._initialState) {
          this.writeData({ data: this._initialState })
        }
      })
  }

  // TODO: remove the next 2 methods and OptimisticCacheLayer
  //       after https://github.com/apollographql/apollo-feature-requests/issues/100
  removeOptimistic(idToRemove) {
    const toReapply = [];
    let removedCount = 0;
    let layer = this.optimisticData;
    while (layer instanceof OptimisticCacheLayer) {
      if (layer.optimisticId === idToRemove) {
        ++removedCount;
      }
      else {
        toReapply.push(layer);
      }
      layer = layer.parent;
    }
    if (removedCount > 0) {
      this.optimisticData = layer;
      while (toReapply.length > 0) {
        const { transaction, optimisticId } = toReapply.pop();
        this.performTransaction(transaction, optimisticId);
      }
      this.broadcastWatches();
    }
  }

  performTransaction(transaction, optimisticId) {
    const { data, silenceBroadcast } = this

    this.silenceBroadcast = true;
    if (typeof optimisticId === 'string') {
      this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
    }
    try {
      transaction(this);
    }
    finally {
      this.silenceBroadcast = silenceBroadcast;
      this.data = data;
    }
    this.broadcastWatches();
  }
}
