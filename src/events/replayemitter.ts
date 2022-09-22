export default class E {
  size: number
  h: object
  q: object

  constructor (replaySize: number | string) {
    if (typeof (replaySize) === 'string') {
      this.size = parseInt(replaySize)
    } else if (typeof (replaySize) === 'number') {
      this.size = replaySize
    } else {
      this.size = 5
    }

    this.h = {}
    this.q = {}
  }

  on<C> (name: string, callback: (ctx: C, event: object) => void, ctx: C): E {
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

  once<C> (name: string, callback: (ctx: C, event: object) => void, ctx: C): E {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    const eventQueue = this.q[name] || []
    if (eventQueue.length > 0) {
      callback.apply(ctx, eventQueue[0])

      return this
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = function (...rest: any[]) {
        self.off(name, listener)
        callback.apply(ctx, rest)
      }

      listener._ = callback
      return this.on(name, listener, ctx)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emit (name: string, event: object): E {
    // eslint-disable-next-line prefer-rest-params
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

  off (name: string, callback: (ctx: any, event: object) => void): E {
    const handlers = this.h[name]
    const liveEvents = []

    if (handlers && callback) {
      for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback && handlers[i].fn._ !== callback) {
          liveEvents.push(handlers[i])
        }
      }
    }

    (liveEvents.length) ? this.h[name] = liveEvents : delete this.h[name]
    return this
  }
}
