import * as C from '../utils/consts'
import { EventBus } from '../types'

type Callback<Ctx> = (ctx: Ctx, data: unknown[]) => void

interface EventHandler<Ctx> {
  ctx?: Ctx,
  fn: Callback<Ctx>
}

export class ReplayEmitter implements EventBus {
  h: Record<string, EventHandler<any>[]>;
  q: Record<string, any[]>;
  size: number;

  constructor (replaySize: number | string) {
    this.size = 5

    if (typeof replaySize === 'number') {
      this.size = replaySize
    } else if (typeof replaySize === 'string') {
      this.size = parseInt(replaySize) || this.size
    }

    this.h = {}
    this.q = {}
  }

  on <Ctx> (name: string, callback: Callback<Ctx>, ctx: Ctx): EventBus {
    const handler: EventHandler<Ctx> = {
      ctx: ctx,
      fn: callback
    };

    (this.h[name] || (this.h[name] = [])).push(handler)

    const eventQueueLen = (this.q[name] || []).length
    for (let i = 0; i < eventQueueLen; i++) {
      callback.apply(ctx, this.q[name][i])
    }

    return this
  }

  once <Ctx> (name: string, callback: Callback<Ctx>, ctx: Ctx): EventBus {
    const eventQueue = this.q[name] || []
    if (eventQueue.length > 0) {
      callback(ctx, eventQueue[0])
      return this
    } else {
      const listener = (...args: any[]) => {
        this.off(name, listener)
        callback(ctx, args)
      }

      listener._ = callback
      return this.on(name, listener, ctx)
    }
  }

  emit (name: string, ...data: any[]): EventBus {
    const evtArr = (this.h[name] || []).slice()
    let i = 0
    const len = evtArr.length

    for (i; i < len; i++) {
      evtArr[i].fn(evtArr[i].ctx, data)
    }

    const eventQueue = this.q[name] || (this.q[name] = [])
    if (eventQueue.length >= this.size) {
      eventQueue.shift()
    }
    eventQueue.push(data)

    return this
  }

  off (name: string, callback: Callback<any>): EventBus {
    const handlers = this.h[name]
    const liveEvents = []

    if (handlers && callback) {
      for (let i = 0, len = handlers.length; i < len; i++) {
        if (handlers[i].fn !== callback) {
          liveEvents.push(handlers[i])
        }
      }
    }

    (liveEvents.length)
      ? this.h[name] = liveEvents
      : delete this.h[name]

    return this
  }

  emitErrorWithMessage (name: string, message?: string, e: object = {}): EventBus {
    const wrappedError = wrapError(name, message, e)
    return this.emit(C.ERRORS_PREFIX, wrappedError)
  }

  emitError (name: string, exception: object & { message?: string }): EventBus {
    return this.emitErrorWithMessage(name, exception.message, exception)
  }
}

export function wrapError (name: string, message: string | undefined, e: object & { message?: string }): any {
  const wrapped: any = new Error(message || e.message)
  wrapped.stack = e.stack
  wrapped.name = name || 'unknown error'
  wrapped.lineNumber = e.lineNumber
  wrapped.columnNumber = e.columnNumber
  return wrapped
}
