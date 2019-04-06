export default class Events {
  static KEY = Symbol('Events')

  constructor() {
    this.topics = new Map()
  }

  emit(mutation, payload) {
    const listeners = this.topics.get(mutation) || []
    listeners.slice(0).forEach(fn => fn(payload))
  }

  on(mutation, callback) {
    const listeners = this.topics.get(mutation) || []
    let isAttached = true

    listeners.push(callback)
    this.topics.set(mutation, listeners)

    return () => {
      if (isAttached) {
        isAttached = false
        listeners.splice(listeners.indexOf(callback), 1)
      }
    }
  }
}
