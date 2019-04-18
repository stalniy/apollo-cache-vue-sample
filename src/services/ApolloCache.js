import { InMemoryCache } from 'apollo-cache-inmemory';
import CachePersistor from './CachePersistor'

export default class ApolloCache extends InMemoryCache {
  constructor({ data, persistance, ...config }) {
    const cacheRedirects = { ...config.cacheRedirects }

    super({
      ...config,
      resultCaching: false,
      cacheRedirects: {
        ...cacheRedirects,
        Query: {
          ...cacheRedirects.Query,
          getFragment: (_, variables, ctx) => ctx.getCacheKey(variables)
        }
      }
    })
    this._initialState = data
    this._persistor = null

    if (data) {
      this.writeData({ data })
    }

    if (persistance && typeof persistance === 'object') {
      this._persistor = new CachePersistor({
        ...persistance,
        cache: this,
      })
    }
  }

  restoreFromStorage() {
    if (!this._persistor) {
      throw new Error('Cannot restore cache. Cache persistance has not been configured.')
    }

    return this._persistor.restore()
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
