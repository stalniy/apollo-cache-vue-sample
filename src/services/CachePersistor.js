import { CachePersistor as ApolloCachePersistor } from 'apollo-cache-persist'

function triggerPersistanceOnWrite(cache, keys, persist) {
  const write = cache.write
  const isUpdatedPersistedValues = data => keys.some(key => key in data)

  cache.write = (...args) => {
    write.apply(cache, args)

    if (isUpdatedPersistedValues(args[0].result)) {
      persist()
    }
  }

  return () => cache.write = write
}

export default class CachePersistor extends ApolloCachePersistor {
  constructor(options) {
    if (options.keys && !options.trigger) {
      options.trigger = triggerPersistanceOnWrite.bind(null, options.cache, options.keys)
    }

    super(options)

    if (options.keys) {
      // TODO: add support for more complicated filters.
      //       finalize and make a PR to apollo-cache-persist
      this.cache.extract = this.extractCache.bind(this, options.keys)
    }
  }

  extractCache(keys) {
    const state = this.cache.cache.extract()
    const roots = ['ROOT_QUERY', '$ROOT_QUERY']

    const filteredState = keys.reduce((all, key) => {
      const valueKey = `$ROOT_QUERY.${key}`

      all.ROOT_QUERY = all.ROOT_QUERY || {}

      if (key in state.ROOT_QUERY) {
        all.ROOT_QUERY[key] = state.ROOT_QUERY[key]
      }

      if (valueKey in state) {
        all[valueKey] = state[valueKey]
      }

      return all
    }, {})

    return this.cache.serialize ? JSON.stringify(filteredState) : filteredState
  }
}
