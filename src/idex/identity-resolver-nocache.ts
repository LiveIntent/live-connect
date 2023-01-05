import { EventBus, ICallHandler, IIdentityResolver, State } from '../types'
import { noopCache, makeIdentityResolver } from './common'

export function IdentityResolver (config: State, calls: ICallHandler, eventBus: EventBus): IIdentityResolver {
  return makeIdentityResolver(config || {}, calls, noopCache, eventBus)
}
