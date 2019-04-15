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

export function createQuery(querySDL) {
  const query = new GqlQuery(this.$root.$options.graphql, querySDL)
  this.$on('hook:beforeDestroy', query.abort.bind(query))
  return query
}
