import { ApolloClient, ObservableQuery } from 'apollo-client'
import Events from './Events'
import { getOperationName } from './gqlAst'

export const FETCH_MORE = Symbol('fetchMore')

// TODO: remove this when https://github.com/apollographql/apollo-feature-requests/issues/97 this is done
const CACHE_UPDATE_DISPOSALS = Symbol('CACHE_DISPOSALS')
ObservableQuery.prototype.on = function on(event, computeNewValue) {
  if (event === FETCH_MORE) {
    this[FETCH_MORE] = computeNewValue
    return this
  }

  const { operationName: name } = getOperationName(this.options.query)
  const dispose = this[Events.KEY].on(event, ({ cache, response, payload }) => {
    const key = { query: this.options.query, variables: this.variables }
    const current = cache.readQuery(key)
    const options = { variables: this.variables, payload }

    key.data = computeNewValue(current[name], response.data, options) || current
    cache.writeQuery(key)
  })

  this[CACHE_UPDATE_DISPOSALS] = this[CACHE_UPDATE_DISPOSALS] || []
  this[CACHE_UPDATE_DISPOSALS].push(dispose)

  return this
};

ObservableQuery.prototype.tearDownQuery = ((original) => {
  return function tearDownQuery(...args) {
    if (this[CACHE_UPDATE_DISPOSALS]) {
      this[CACHE_UPDATE_DISPOSALS].forEach(dispose => dispose())
      this[CACHE_UPDATE_DISPOSALS] = null
    }

    if (this[FETCH_MORE]) {
      this[FETCH_MORE] = null
    }

    return original.apply(this, args)
  }
})(ObservableQuery.prototype.tearDownQuery);

ObservableQuery.prototype.fetchMore = ((original) => {
  return function fetchMore(options) {
    let updateQuery

    if (this[FETCH_MORE]) {
      const { operationName: name } = getOperationName(this.options.query)
      updateQuery = (current, response) => {
        if (!response.fetchMoreResult) {
          return current
        }

        const data = response.fetchMoreResult[name]
        const state = this[FETCH_MORE](current[name], data)

        state.__typename = data.__typename

        return { [name]: state }
      }
    }

    return original.call(this, { updateQuery, ...options })
  }
})(ObservableQuery.prototype.fetchMore);

function rejectTypename(key, value) {
  return key === '__typename' ? undefined : value
}

export default class GraphqlClient extends ApolloClient {
  constructor(options) {
    const resolvers = { ...options.resolvers }
    super({
      ...options,
      resolvers: {
        ...resolvers,
        Query: {
          ...resolvers.Query,
          getFragment: (_, variables, { cache }) => {
            console.log('here?')
            const fragmentId = cache.config.dataIdFromObject(variables);
            console.log(fragmentId)
            return cache.data.data[fragmentId];
          },
        }
      }
    })
    this.optimisticResponse = options.optimisticResponse
    this[Events.KEY] = new Events()
    this.configureCache = options.configureCache || {}
    this.onClearStore(this.cache.reset.bind(this.cache))
  }

  mutate(options) {
    if (options.optimisticResponse && this.optimisticResponse) {
      options.optimisticResponse = this.optimisticResponse(options.mutation, options.optimisticResponse)
    }

    if (options.variables) {
      options.variables = JSON.parse(JSON.stringify(options.variables), rejectTypename)
    }

    return super.mutate({
      update: (cache, response) => this[Events.KEY].emit(options.mutation, {
        mutation: options.mutation,
        payload: options.variables,
        cache,
        response
      }),
      ...options,
    })
  }

  watchQuery(options, ...args) {
    const query = super.watchQuery(options, ...args)
    const queryDef = options.query.definitions[0]
    const configureCacheUpdates = this.configureCache[queryDef.name.value]

    if (configureCacheUpdates) {
      query[Events.KEY] = this[Events.KEY]
      configureCacheUpdates(query)
    }

    return query
  }
}
