import { LiveConnectConfig } from '../types'
import { EventBus } from 'live-connect-common'

export function removeInvalidPairs(config: LiveConnectConfig, eventBus: EventBus): LiveConnectConfig {
  const { appId, distributorId, ...rest } = config

  if (appId && distributorId) {
    // As per documentation: appId is deprecated parameter
    const error = new Error(`Event contains both appId: ${appId} and distributorId: ${distributorId}. Ignoring distributorId`)
    eventBus.emitError('AppIdAndDistributorIdPresent', error)
    return { ...rest, appId }
  }
  return config
}
