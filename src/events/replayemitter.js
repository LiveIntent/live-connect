/**
 * @typedef {Object} ReplayEmitter
 * @property {(function)} on
 * @property {(function)} once
 * @property {(function)} emit
 * @property {(function)} off
 */

export function fromBusReset (bus) {
  const e = new E()
  e.size = bus.size
  e.h = bus.h
  e.q = bus.q
  bus.h = {}
  bus.q = {}
  return e
}

export default function E (replaySize) {
  this.size = parseInt(replaySize) || 5
  this.h = {}
  this.q = {}
}

E.prototype = {

  on: function (name, callback, ctx) {
    (this.h[name] || (this.h[name] = [])).push({
      fn: callback,
      ctx: ctx
    })

    const eventQueueLen = (this.q[name] || []).length
    for (let i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.q[name][i])
    }

    return this
  },

  once: function (name, callback, ctx) {
    const self = this

    const eventQueue = this.q[name] || []
    if (eventQueue.length > 0) {
      callback.apply(ctx, eventQueue[0])

      return this
    } else {
      const listener = function () {
        self.off(name, listener)
        callback.apply(ctx, arguments)
      }

      listener._ = callback
      return this.on(name, listener, ctx)
    }
  },

  emit: function (name) {
    const data = [].slice.call(arguments, 1)
    this.emitNoForward(name, data)

    if (this.global) {
      this.global.emitNoForward(name, data)
    }

    if (this.current) {
      this.current.emitNoForward(name, data)
    }

    return this
  },

  off: function (name, callback) {
    const handlers = this.h[name]
    const liveEvents = []

    if (handlers && callback) {
      for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback && handlers[i].fn._ !== callback) {
          liveEvents.push(handlers[i])
        }
      }
    }

    (liveEvents.length)
      ? this.h[name] = liveEvents
      : delete this.h[name]

    return this
  },

  emitNoForward: function (name, data) {
    const evtArr = (this.h[name] || []).slice()
    let i = 0
    const len = evtArr.length
    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data)
    }
    const eventQueue = this.q[name] || (this.q[name] = [])
    if (eventQueue.length >= this.size) {
      eventQueue.shift()
    }
    eventQueue.push(data)
    return this
  },

  hierarchical: function () {
    return true
  },

  setGlobal: function (other) {
    this.global = other
    return this
  },

  unsetGlobal: function () {
    delete this.global
  },

  setCurrent: function (other) {
    this.current = other
    return this
  }
}
