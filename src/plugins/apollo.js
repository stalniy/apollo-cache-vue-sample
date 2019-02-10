import { ApolloClient } from 'apollo-client';
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

const link = new ApolloLink((operation) => {
  return new Observable((observer) => {
    setTimeout(() => {
      observer.next({
        data: {
          repository: [{
            __typename: 'Repository',
            id: 1,
            name: 'casl',
            createdAt: new Date().toISOString()
          }]
        }
      })
    }, 1000)
  })
})

const setContextLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    ...graphQlClient.defaultContext
  })
  return forward(operation)
})

export const graphQlClient = new ApolloClient({
  cache,
  link: setContextLink.concat(new HttpLink({
    uri: 'http://localhost:4444/api/gql'
  })),
})

function resolveVars(self, variables) {
  if (typeof variables === 'string') {
    return self[variables]()
  }

  if (typeof variables === 'function') {
    return variables.call(self)
  }

  if (variables && typeof variables === 'object') {
    return variables
  }

  return void 0
}

export function mapQuery(query, { variables, ...apolloOptions }) {
  if (query.definitions.length !== 1) {
    throw new Error('mapQuery expects query to contains only one operation')
  }

  const [queryDef] = query.definitions
  const name = queryDef.selectionSet.selections[0].name.value
  const varsCache = `__${queryDef.name.value}.vars__`

  return {
    computed: {
      [varsCache]() {
        return resolveVars(this, variables)
      },
      [name]() {
        try {
          return graphQlClient.readQuery({
            query,
            variables: this[varsCache]
          })
        } catch (e) {
          return null
        }
      }
    },
    methods: {
      [queryDef.name.value](params) {
        return graphQlClient.query({
          ...apolloOptions,
          ...params,
          variables: this[varsCache],
          query,
        })
      }
    }
  }
}

export function mapApolloCache(query, { defaultValue, ...params } = {}) {
  const [queryDef] = query.definitions
  const name = queryDef.selectionSet.selections[0].name.value

  return (_, getters) => {
    return (variables, options) => {
      try {
        const value = getters.apollo.readQuery({
          ...params,
          ...options,
          query,
          variables: variables || params.variables
        }, true)

        return value ? value[name] : defaultValue
      } catch (e) {
        if (!e.message.includes(`Can't find field`)) {
          throw e
        }

        return defaultValue
      }
    }
  }
}
