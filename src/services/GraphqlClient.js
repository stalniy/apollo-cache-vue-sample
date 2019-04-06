import { ApolloClient, ObservableQuery } from 'apollo-client'
import Events from './Events'

// TODO: remove this when https://github.com/apollographql/apollo-feature-requests/issues/97 this is done
const CACHE_UPDATE_DISPOSALS = Symbol('CACHE_DISPOSALS')
ObservableQuery.prototype.on = function on(event, computeNewValue) {
  const queryDef = this.options.query.definitions[0]
  const name = queryDef.selectionSet.selections[0].name.value
  const dispose = this[Events.KEY].on(event, ({ cache, response }) => {
    const key = { query: this.options.query, variables: this.variables }
    const current = cache.readQuery(key)

    key.data = computeNewValue(current[name], response.data, this.variables) || current
    cache.writeQuery(key)
  })

  this[CACHE_UPDATE_DISPOSALS] = this[CACHE_UPDATE_DISPOSALS] || []
  this[CACHE_UPDATE_DISPOSALS].push(dispose)

  return this
};

ObservableQuery.prototype.tearDownQuery = ((original) => {
  return function tearDownQuery(...args) {
    this[CACHE_UPDATE_DISPOSALS].forEach(dispose => dispose())
    this[CACHE_UPDATE_DISPOSALS] = null
    return original.apply(this, args)
  }
})(ObservableQuery.prototype.tearDownQuery);

export default class GraphqlClient extends ApolloClient {
  constructor(options, ...args) {
    super(options, ...args)
    this[Events.KEY] = new Events()
    this.syncQueryCache = options.syncQueryCache || {}
  }

  mutate(options) {
    return super.mutate({
      update: (cache, response) => this[Events.KEY].emit(options.mutation, {
        mutation: options.mutation,
        cache,
        response
      }),
      ...options,
    })
  }

  watchQuery(options, ...args) {
    const query = super.watchQuery(options, ...args)
    const queryDef = options.query.definitions[0]
    const configureCacheUpdates = this.syncQueryCache[queryDef.name.value]

    if (configureCacheUpdates) {
      query[Events.KEY] = this[Events.KEY]
      configureCacheUpdates(query)
    }

    return query
  }
}
