/**
 * @typedef {Object} ReplayEmitter
 * @property {(function)} on
 * @property {(function)} once
 * @property {(function)} emit
 * @property {(function)} off
 * @property {(function)} emitError
 * @property {(function)} encodeEmitError
 */

import * as C from '../utils/consts'

export class E {
  constructor (replaySize) {
    this.size = parseInt(replaySize) || 5
    this.h = {}
    this.q = {}
  }

  on (name, callback, ctx) {
    (this.h[name] || (this.h[name] = [])).push({
      fn: callback,
      ctx: ctx
    })

    const eventQueueLen = (this.q[name] || []).length
    for (let i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.q[name][i])
    }

    return this
  }

  once (name, callback, ctx) {
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
  }

  emit (name) {
    const data = [].slice.call(arguments, 1)
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
  }

  off (name, callback) {
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
  }

  emitError (name, message, e = {}) {
    const wrappedError = wrapError(name, message, e)
    this.emit(C.ERRORS_PREFIX, wrappedError)
  }

  encodeEmitError (name, exception) {
    this.emitError(name, exception.message, exception)
  }
}

export function wrapError (name, message, e = {}) {
  const wrapped = new Error(message || e.message)
  wrapped.stack = e.stack
  wrapped.name = name || 'unknown error'
  wrapped.lineNumber = e.lineNumber
  wrapped.columnNumber = e.columnNumber
  return wrapped
}
