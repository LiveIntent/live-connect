import { DEFAULT_IDEX_EXPIRATION_HOURS } from '../utils/consts'
import { storageHandlerBackedCache, makeIdentityResolver } from './common'

/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @param {CallHandler} calls
 * @param {EventBus} messageBus
 * @return {IdentityResolver}
 * @constructor
 */
export function IdentityResolver (config, storageHandler, calls, messageBus) {
  const nonNullConfig = config || {}
  const idexConfig = nonNullConfig.identityResolutionConfig || {}
  const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
  const domain = nonNullConfig.domain

  const cache = storageHandlerBackedCache(expirationHours, domain, storageHandler, messageBus)
  return makeIdentityResolver(nonNullConfig, calls, cache, messageBus)
}
