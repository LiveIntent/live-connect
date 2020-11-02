/**
 * @typedef {Object} LegacyId
 * @property {string} duid
 * @property {string} creationTs
 * @property {string} sessionCount
 * @property {string} currVisitTs
 * @property {string} lastSessionVisitTs
 * @property {string} sessionId
 */

/**
 * @typedef {Object} State
 * @property {(string|null)} [appId]
 * @property {(object|undefined)} [eventSource]
 * @property {(string|undefined)} [liveConnectId]
 * @property {(string|undefined)} [trackerName]
 * @property {(string|undefined)} [pageUrl]
 * @property {(string|undefined)} [domain]
 * @property {(string|undefined)} [usPrivacyString]
 * @property {(string|undefined)} [expirationDays]
 * @property {(string|undefined)} [wrapperName]
 * @property {(HashedEmail[])} [hashesFromIdentifiers]
 * @property {(string[]|undefined)} [identifiersToResolve]
 * @property {string[]} [decisionIds]
 * @property {string|undefined} [peopleVerifiedId]
 * @property {(string|undefined)} [storageStrategy]
 * @property {LegacyId} [legacyId]
 * @property {ErrorDetails} [errorDetails]
 * @property {RetrievedIdentifier[]} [retrievedIdentifiers]
 * @property {HashedEmail[]} [hashedEmail]
 * @property {string} [providedHash]
 * @property {(IdexConfig|undefined)} [identityResolutionConfig]
 * @property {(boolean|undefined)} [gdprApplies]
 * @property {(string|undefined)} [gdprConsent]
 */

/**
 * @typedef {Object} StateWrapper
 * @property {State} data
 * @property {function} asTuples
 * @property {function} asQueryString
 * @property {function} combineWith
 * @property {function} sendsPixel
 * @property {StorageManager} storageHandler
 */

import * as emitter from '../utils/emitter'
import { fiddle } from './fiddler'
import { isObject, trim } from '../utils/types'
import { toParams } from '../utils/url'

/**
 * @param {string} param
 * @param {string|null} value
 * @param {function} transform
 * @return {*[]|Array}
 * @private
 */

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']
/**
 * @param {State} state
 * @returns {StateWrapper}
 * @constructor
 */
export function StateWrapper (state) {
  /**
   * @type {State}
   */
  let _state = {}
  if (state) {
    _state = _safeFiddle(state)
  }

  function _sendsPixel () {
    const eventKeys = Object.keys(isObject(_state.eventSource) ? _state.eventSource : {})
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event')
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0]
    const eventName = eventKey && trim(_state.eventSource[eventKey])
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }

  function _safeFiddle (newInfo) {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)))
    } catch (e) {
      console.error(e)
      emitter.error('StateCombineWith', 'Error while extracting event data', e)
      return _state
    }
  }

  /**
   * @param {State} newInfo
   * @return {StateWrapper}
   * @private
   */
  function _combineWith (newInfo) {
    return new StateWrapper({ ..._state, ...newInfo })
  }

  /**
   * @returns {string [][]}
   * @private
   */
  function _asTuples (allowedParams) {
    let array = []
    Object.keys(_state).forEach((key) => {
      const value = _state[key]
      if (allowedParams[key]) {
        const params = allowedParams[key](value)
        if (params && params.length) {
          if (params[0] instanceof Array) {
            array = array.concat(params)
          } else {
            array.push(params)
          }
        }
      }
    })
    return array
  }

  /**
   * @returns {string}
   * @private
   */
  function _asQueryString (allowedParams = {}) {
    return toParams(_asTuples(allowedParams))
  }

  return {
    data: _state,
    combineWith: _combineWith,
    asQueryString: _asQueryString,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
  }
}
