/**
 * @typedef {Object} LiveConnect
 * @property {(function)} push
 * @property {(function)} fire
 * @property {(function)} peopleVerifiedId
 * @property {(boolean)} ready
 * @property {(function)} resolve
 * @property {(function)} resolutionCallUrl
 */

/**
 * @typedef {Object} IdexConfig
 * @property {(number|undefined)} expirationDays
 * @property {(number|undefined)} ajaxTimeout
 * @property {(string|undefined)} source
 * @property {(number|undefined)} publisherId
 * @property {(string|undefined)} url
 */

/**
 * @typedef {Object} LiveConnectConfiguration
 * @property {(string|undefined)} appId
 * @property {(StorageStrategy|null)} storageStrategy
 * @property {(string|undefined)} providedIdentifierName
 * @property {(string|undefined)} collectorUrl
 * @property {(string|undefined)} usPrivacyString
 * @property {(number|undefined)} expirationDays
 * @property {{string[]|undefined}} identifiersToResolve
 * @property {{IdexConfig|undefined}} identityResolutionConfig
 */

import { PixelSender } from './pixel/sender'
import { StateWrapper } from './pixel/state'
import * as legacyDuid from './manager/legacy-duid'
import * as identifiers from './manager/identifiers'
import * as decisions from './manager/decisions'
import * as peopleVerified from './manager/people-verified'
import * as eventBus from './events/bus'
import * as pageEnricher from './enrichers/page'
import * as emitter from './utils/emitter'
import * as errorHandler from './events/error-pixel'
import * as C from './utils/consts'
import * as cookies from './enrichers/identifiers'
import { isArray, isObject } from './utils/types'
import * as idex from './idex/identity-resolver'
import { StorageHandler } from './handlers/storage-handler'

const hemStore = {}
function _pushSingleEvent (event, pixelClient, enrichedState) {
  if (!event || !isObject(event)) {
    emitter.error('EventNotAnObject', 'Received event was not an object', new Error(event))
  } else if (event.config) {
    emitter.error('StrayConfig', 'Received a config after LC has already been initialised', new Error(event))
  } else {
    const combined = enrichedState.combineWith({ eventSource: event })
    hemStore.hashedEmail = hemStore.hashedEmail || combined.data.hashedEmail
    const withHemStore = { eventSource: event, ...hemStore }
    pixelClient.send(enrichedState.combineWith(withHemStore))
  }
}

function _processArgs (args, pixelClient, enrichedState) {
  try {
    args.forEach(arg => {
      const event = arg
      if (isArray(event)) {
        event.forEach(e => _pushSingleEvent(e, pixelClient, enrichedState))
      } else {
        _pushSingleEvent(event, pixelClient, enrichedState)
      }
    })
  } catch (e) {
    console.error('Error sending events', e)
    emitter.error('LCPush', 'Failed sending an event', e)
  }
}

/**
 * @param {LiveConnectConfiguration} liveConnectConfig
 * @param {StorageHandler} externalStorageHandler
 * @returns {LiveConnect}
 * @constructor
 */
export function LiveConnect (liveConnectConfig, externalStorageHandler) {
  let configuration = {}
  try {
    configuration = isObject(liveConnectConfig) && liveConnectConfig
    eventBus.init()
    errorHandler.register(configuration)
  } catch (e) {
    console.error('Could not initialize error bus')
  }

  try {
    const storageHandler = StorageHandler(configuration.storageStrategy, externalStorageHandler)
    const reducer = (accumulator, func) => accumulator.combineWith(func(accumulator.data, storageHandler))

    const managers = [legacyDuid.resolve, identifiers.resolve, peopleVerified.resolve, decisions.resolve]
    const enrichers = [pageEnricher.enrich, cookies.enrich]

    const enrichedState = enrichers.reduce(reducer, new StateWrapper(configuration))
    const postManagedState = managers.reduce(reducer, enrichedState)

    console.log('LiveConnect.postManagedState', postManagedState)
    console.log('LiveConnect.enrichedState', enrichedState)
    const syncContainerData = { ...liveConnectConfig, ...{ peopleVerifiedId: postManagedState.data.peopleVerifiedId } }
    const onPixelLoad = () => emitter.send(C.PIXEL_SENT_PREFIX, syncContainerData)
    const onPixelPreload = () => emitter.send(C.PRELOAD_PIXEL, '0')
    const pixelClient = new PixelSender(liveConnectConfig, onPixelLoad, onPixelPreload)
    const resolver = idex.IdentityResolver(postManagedState.data, storageHandler)
    const _push = (...args) => _processArgs(args, pixelClient, postManagedState)
    return {
      push: _push,
      fire: () => _push({}),
      peopleVerifiedId: postManagedState.data.peopleVerifiedId,
      ready: true,
      resolve: resolver.resolve,
      resolutionCallUrl: resolver.getUrl
    }
  } catch (x) {
    console.error(x)
    emitter.error('LCConstruction', 'Failed to build LC', x)
    return window.liQ
  }
}
