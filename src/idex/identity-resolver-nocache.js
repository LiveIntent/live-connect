import { noopCache, makeIdentityResolver } from './common'

/**
 * @param {State} config
 * @param {CallHandler} calls
 * @return {IdentityResolver}
 * @constructor
 */
export function IdentityResolver (config, calls, messageBus) {
  return makeIdentityResolver(config || {}, calls, noopCache, messageBus)
}
