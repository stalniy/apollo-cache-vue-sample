import Vue from 'vue'
import { getOperationName } from './gqlAst'

export default class GqlQuery {
  constructor(client, query, options = null) {
    this.client = client
    this.query = query
    this.options = options
    this.queryName = getOperationName(query).operationName
    Vue.util.defineReactive(this, 'isLoading', false)
    Vue.util.defineReactive(this, 'response', null)
    this.unsubscribe = null
  }

  get results() {
    return this.response && this.response.data
      ? this.response.data[this.queryName]
      : undefined
  }

  fetch(variables, options = null) {
    this.abort()
    this.observedQuery = this.client.watchQuery({
      ...this.options,
      ...options,
      query: this.query,
      variables
    })
    this.isLoading = true

    if (options && options.fetchPolicy && options.fetchPolicy.startsWith('cache')) {
      this.response = this.client.readQuery({ query: this.query, variables })
    }

    return new Promise((resolve, reject) => {
      const subscription = this.observedQuery.subscribe(
        (response) => {
          this.response = response
          this.isLoading = false
          resolve(response)
        },
        (error) => {
          this.isLoading = false
          reject(error)
        }
      )
      this.unsubscribe = () => {
        subscription.unsubscribe()
        this.unsubscribe = null
        this.observedQuery = null
        this.isLoading = false
        this.response = null
      }
    })
  }

  fetchMore(variables, options = null) {
    return this.observedQuery.fetchMore({
      ...options,
      variables
    })
  }

  abort() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  updateCache(rawValue) {
    let value = rawValue

    if (typeof this.results === 'object') {
      value = { ...this.results, ...rawValue }
    }

    this.client.writeQuery({
      query: this.query,
      variables: this.observedQuery ? this.observedQuery.variables : undefined,
      data: {
        [this.queryName]: value
      }
    })
  }
}
