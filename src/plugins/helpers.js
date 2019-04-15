function rejectTypename(key, value) {
  return key === '__typename' ? undefined : value
}

export function mapMutations(mutations) {
  return mutations.reduce((object, mutation) => {
    const def = mutation.definitions[0]
    const mutationName = def.selectionSet.selections[0].name.value

    object[def.name.value] = function(variables, options = null) {
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
          [mutationName]: {
            __typename: `${params.optimisticResponse.__typename}Event`,
            details: params.optimisticResponse
          }
        }
      }

      console.log(params)

      return this.$root.$options.graphql.mutate(params)
    }

    return object
  }, {})
}
