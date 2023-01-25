import { CallHandler } from '../handlers/call-handler'
import { EventBus, IIdentityResolver, State } from '../types'
import { noopCache, makeIdentityResolver } from './common'

export function IdentityResolver (config: State, calls: CallHandler, eventBus: EventBus): IIdentityResolver {
  return makeIdentityResolver(config || {}, calls, noopCache, eventBus)
}
