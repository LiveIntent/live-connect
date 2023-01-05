import { ICallHandler, IIdentityResolver, IStorageHandler, State } from '../types'
import { DEFAULT_IDEX_EXPIRATION_HOURS } from '../utils/consts'
import { storageHandlerBackedCache, makeIdentityResolver } from './common'

<<<<<<< HEAD:src/idex/identity-resolver.ts
export function IdentityResolver (config: State, storageHandler: IStorageHandler, calls: ICallHandler): IIdentityResolver {
=======
/**
 * @param {State} config
 * @param {StorageHandler} storageHandler
 * @param {CallHandler} calls
 * @param {EventBus} eventBus
 * @return {IdentityResolver}
 * @constructor
 */
export function IdentityResolver (config, storageHandler, calls, eventBus) {
>>>>>>> master:src/idex/identity-resolver.js
  const nonNullConfig = config || {}
  const idexConfig = nonNullConfig.identityResolutionConfig || {}
  const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
  const domain = nonNullConfig.domain

  const cache = storageHandlerBackedCache(expirationHours, domain, storageHandler, eventBus)
  return makeIdentityResolver(nonNullConfig, calls, cache, eventBus)
}
