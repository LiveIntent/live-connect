import { EventBus, LiveConnectConfig } from '../types'

export function removeInvalidPairs(config: LiveConnectConfig, eventBus: EventBus): LiveConnectConfig {
  if (config && config.appId && config.distributorId) {
    const distributorId = config.distributorId
    delete config.distributorId
    eventBus.emitError('AppIdAndDistributorIdPresent', new Error(`Event contains both appId: ${config.appId} and distributorId: ${distributorId}. Ignoring distributorId`))
  }
  return config
}
