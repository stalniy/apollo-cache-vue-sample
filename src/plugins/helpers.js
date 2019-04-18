import Vue from 'vue'
import GqlQuery from '../services/GqlQuery'
import { getOperationName } from '../services/gqlAst'

function rejectTypename(key, value) {
  return key === '__typename' ? undefined : value
}

export function mapMutations(mutations) {
  return mutations.reduce((methods, mutation) => {
    const { name, operationName } = getOperationName(mutation)

    methods[name] = function(variables, options = null) {
      const params = {
        ...options,
        mutation,
      }

      if (variables) {
        params.variables = JSON.parse(JSON.stringify(variables), rejectTypename)
      }

      if (params.optimisticResponse) {
        params.optimisticResponse = {
          __typename: 'Mutation',
          [operationName]: {
            __typename: `${params.optimisticResponse.__typename}Event`,
            details: params.optimisticResponse
          }
        }
      }

      return this.$root.$options.graphql.mutate(params)
    }

    return methods
  }, {})
}

export function createQuery(querySDL, options = null) {
  const query = new GqlQuery(this.$root.$options.graphql, querySDL, options)
  this.$on('hook:beforeDestroy', query.abort.bind(query))
  return query
}

export function mapClientQueries(queries) {
  return queries.reduce((all, query) => {
    const { operationName } = getOperationName(query)
    const reactivity = new Vue({ data: { state: null } })
    const getter = () => reactivity.state
    const syncCache = function(state) {
      this.$root.$options.graphql.writeQuery({ query, data: { ...state } })
    }

    all[operationName] = function mappedGetter() {
      const data = this.$root.$options.graphql.readQuery({ query })

      if (!reactivity.state) {
        // TODO: this is side-effect, need to find a better way
        this.$watch(getter, syncCache, { deep: true })
        this.$once('hook:beforeDestroy', () => reactivity.state = null)
        reactivity.state = data
      }

      return data[operationName]
    }

    return all
  }, {})
}
