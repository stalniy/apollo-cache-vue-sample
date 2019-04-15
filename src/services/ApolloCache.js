import { InMemoryCache } from 'apollo-cache-inmemory';

export default class ApolloCache extends InMemoryCache {
  constructor({ data, ...config }) {
    super({ ...config, resultCaching: false })
    this._initialState = data

    if (data) {
      this.writeData({ data })
    }
  }

  reset() {
    return super.reset()
      .then(() => {
        if (this._initialState) {
          this.writeData({ data: this._initialState })
        }
      })
  }
}
