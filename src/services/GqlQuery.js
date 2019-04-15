import Vue from 'vue'
import { getOperationName } from './gqlAst'

export default class GqlQuery {
  constructor(client, query, options = null) {
    this.client = client
    this.query = query
    this.options = options
    this.queryName = getOperationName(query).operationName
    Vue.util.defineReactive(this, 'isLoading', false)
    Vue.util.defineReactive(this, 'observedQuery', null)
    this.unsubscribe = null
  }

  get results() {
    return this.response
      ? this.response.data[this.queryName]
      : undefined
  }

  get response() {
    return this.observedQuery
      ? this.observedQuery.currentResult()
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

    return new Promise((resolve, reject) => {
      const subscription = this.observedQuery.subscribe(
        resolve,
        reject,
        () => this.isLoading = false
      )
      this.unsubscribe = () => {
        subscription.unsubscribe()
        this.unsubscribe = null
        this.observedQuery = null
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
}
