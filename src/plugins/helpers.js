import GqlQuery from '../services/GqlQuery'

export function createQuery(querySDL, options = null) {
  const query = new GqlQuery(this.$apollo, querySDL, options)
  this.$on('hook:beforeDestroy', query.abort.bind(query))
  return query
}
