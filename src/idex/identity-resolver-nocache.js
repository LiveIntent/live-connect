import { noopCache, makeIdentityResolver } from './common'

/**
 * @param {State} config
 * @param {CallHandler} calls
 * @param {EventBus} eventBus
 * @return {IdentityResolver}
 * @constructor
 */
export function IdentityResolver (config, calls, eventBus) {
  return makeIdentityResolver(config || {}, calls, noopCache, eventBus)
}
