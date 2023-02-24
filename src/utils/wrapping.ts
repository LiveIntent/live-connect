import { EventBus } from '../types'
import { isFunction, isObject } from 'live-connect-common'

export type NoopFunction = () => undefined

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

  wrap<K extends keyof T & string>(functionName: K): NonNullable<T[K]> | NoopFunction {
    if (isObject(this.obj)) {
      const member = this.obj[functionName]
      if (isFunction(member)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return member.bind(this.obj as any) as NonNullable<T[K]>
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
