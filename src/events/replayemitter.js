/**
 * @typedef {Object} ReplayEmitter
 * @property {(function)} on
 * @property {(function)} once
 * @property {(function)} emit
 * @property {(function)} off
 */

export default function E (replaySize) {
  this.replaySize = parseInt(replaySize) || 5
  this.handlers = {}
  this.queue = {}
}

E.prototype = {
  on: function (name, callback, ctx) {
    (this.handlers[name] || (this.handlers[name] = [])).push({
      fn: callback,
      ctx: ctx
    })

    const eventQueueLen = (this.queue[name] || []).length
    for (let i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.queue[name][i])
    }

    return this
  },

  once: function (name, callback, ctx) {
    const self = this

    const eventQueue = this.queue[name] || []
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
    const evtArr = (this.handlers[name] || []).slice()
    let i = 0
    const len = evtArr.length

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data)
    }

    const eventQueue = this.queue[name] || (this.queue[name] = [])
    if (eventQueue.length >= this.replaySize) {
      eventQueue.shift()
    }
    eventQueue.push(data)

    return this
  },

  off: function (name, callback) {
    const handlers = this.handlers[name]
    const liveEvents = []

    if (handlers && callback) {
      for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback && handlers[i].fn._ !== callback) {
          liveEvents.push(handlers[i])
        }
      }
    }

    (liveEvents.length)
      ? this.handlers[name] = liveEvents
      : delete this.handlers[name]

    return this
  }
}
