import { EventBus } from '../types.js'
import { isFunction, isObject } from 'live-connect-common'

export type Wrapped<T> = NonNullable<T> | (() => undefined)

const noop = () => undefined

export class WrappingContext<T extends object> {
  private obj: T
  private name: string
  private errors: string[]
  private eventBus: EventBus

  constructor (obj: T, name: string, eventBus: EventBus) {
    this.obj = obj
    this.name = name
    this.errors = []
    this.eventBus = eventBus
  }

  wrap<K extends keyof T & string>(functionName: K): Wrapped<T[K]> {
    if (isObject(this.obj)) {
      const member = this.obj[functionName]
      if (isFunction(member)) {
        return (...args) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (member as any).call(this.obj, ...args)
          } catch (e) {
            this.eventBus.emitErrorWithMessage(this.name, `Failed calling ${functionName}`, e)
          }
        }
      }
    }
    this.errors.push(functionName)
    return noop
  }

  reportErrors(): void {
    if (this.errors.length > 0) {
      this.eventBus.emitErrorWithMessage(this.name, `The functions '${JSON.stringify(this.errors)}' were not provided`)
    }
  }
}
