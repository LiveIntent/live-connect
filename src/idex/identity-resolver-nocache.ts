import { CallHandler } from '../handlers/call-handler'
import { noopCache } from './cache'
import { makeIdentityResolver, IdentityResolver } from './common'

export function IdentityResolver (config, calls: CallHandler): IdentityResolver {
  return makeIdentityResolver(config || {}, calls, noopCache)
}
