/**
 * @param {LiveConnectConfiguration} config
 * @return {LiveConnectConfiguration}
 */
export function removeInvalidPairs (config, eventBus) {
  if (config.appId && config.distributorId) {
    const distributorId = config.distributorId
    delete config.distributorId
    eventBus.emitError('AppIdAndDistributorIdPresent', new Error(`Event contains both appId: ${config.appId} and distributorId: ${distributorId}. Ignoring distributorId`))
  }
  return config
}
