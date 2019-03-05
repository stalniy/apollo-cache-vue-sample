import { ApolloClient, ObservableQuery } from 'apollo-client';
import { InMemoryCache, ObjectCache } from 'apollo-cache-inmemory';
import { ApolloLink, Observable } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import Vue from 'vue';


class VueStore extends ObjectCache {
  constructor(store) {
    super()
    Vue.util.defineReactive(this, 'data', store || this.data)
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

class MyCache extends InMemoryCache {
  constructor(...args) {
    super(...args)
    this.data = new VueStore()
    Vue.util.defineReactive(this, 'optimisticData', this.data)
  }

  removeOptimistic(idToRemove) {
        var toReapply = [];
        var removedCount = 0;
        var layer = this.optimisticData;
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
                var layer_1 = toReapply.pop();
                this.performTransaction(layer_1.transaction, layer_1.optimisticId);
            }
            this.broadcastWatches();
        }
    }
    performTransaction(transaction, optimisticId) {
        var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
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

const cache = new MyCache();

const setContextLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    ...graphQlClient.defaultContext
  })
  return forward(operation)
})


ObservableQuery.prototype.on = function on(event, listener) {
  this.__watches = this.__watches || []
  const queryDef = this.options.query.definitions[0]
  const name = queryDef.selectionSet.selections[0].name.value

  this.__watches.push(this[EVENTS_KEY].on(event, ({ cache, response }) => {
    const key = { query: this.options.query, variables: this.variables }
    const current = cache.readQuery(key)

    key.data = listener(current[name], response.data) || current
    cache.writeQuery(key)
  }))
  return this;
};

ObservableQuery.prototype.tearDownQuery = ((_super) => {
  return function tearDownQuery(...args) {
    this.__watches.forEach(fn => fn())
    this.__watches.length = 0
    return _super.apply(this, args)
  }
})(ObservableQuery.prototype.tearDownQuery);

const noop = () => {}
ObservableQuery.prototype.load = function load(variables) {
  const result = this.setVariables(variables, true);

  if (!this.observers.length) {
    this.subscribe(noop)
  }

  return result
}

const EVENTS_KEY = Symbol('GraphqlClient')

class Events {
  constructor() {
    this.topics = new Map()
  }

  emit(mutation, payload) {
    const listeners = this.topics.get(mutation) || []
    listeners.slice(0).forEach(fn => fn(payload))
  }

  on(mutation, callback) {
    const listeners = this.topics.get(mutation) || []
    let isAttached = true

    listeners.push(callback)
    this.topics.set(mutation, listeners)

    return () => {
      if (isAttached) {
        isAttached = false
        listeners.splice(listeners.indexOf(callback), 1)
      }
    }
  }
}

class GraphQlClient extends ApolloClient {
  constructor(...args) {
    super(...args)
    this._events = new Events()
  }

  mutate(options) {
    return super.mutate({
      update: (cache, response) => this._events.emit(options.mutation, {
        mutation: options.mutation,
        cache,
        response
      }),
      ...options,
    })
  }

  watchQuery(...args) {
    const query = super.watchQuery(...args)

    query[EVENTS_KEY] = this._events

    return query
  }
}

export const graphQlClient = new GraphQlClient({
  cache,
  link: setContextLink.concat(new HttpLink({
    uri: 'http://localhost:4444/api/gql'
  })),
})
