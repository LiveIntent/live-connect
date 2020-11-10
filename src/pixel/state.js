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
import { base64UrlEncode } from '../utils/b64'
import { replacer } from './stringify'
import { fiddle } from './fiddler'
import { isObject, trim, merge, asStringParam, asParamOrEmpty } from '../utils/types'
import { toParams } from '../utils/url'

/**
 * @param {string} param
 * @param {string|null} value
 * @param {function} transform
 * @return {*[]|Array}
 * @private
 */

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

const _pMap = {
  appId: aid => {
    return asStringParam('aid', aid)
  },
  eventSource: source => {
    return asParamOrEmpty('se', source, (s) => base64UrlEncode(JSON.stringify(s, replacer)))
  },
  liveConnectId: fpc => {
    return asStringParam('duid', fpc)
  },
  legacyId: legacyFpc => {
    return asStringParam('lduid', legacyFpc && legacyFpc.duid)
  },
  trackerName: tn => {
    return asStringParam('tna', tn || 'unknown')
  },
  pageUrl: purl => {
    return asStringParam('pu', purl)
  },
  errorDetails: ed => {
    return asParamOrEmpty('ae', ed, (s) => base64UrlEncode(JSON.stringify(s)))
  },
  retrievedIdentifiers: identifiers => {
    const identifierParams = []
    identifiers.forEach((i) => identifierParams.push(asStringParam(`ext_${i.name}`, i.value)))
    return identifierParams
  },
  hashesFromIdentifiers: hashes => {
    const hashParams = []
    hashes.forEach((h) => hashParams.push(asStringParam('scre', `${h.md5},${h.sha1},${h.sha256}`)))
    return hashParams
  },
  decisionIds: dids => {
    return asStringParam('li_did', dids.join(','))
  },
  hashedEmail: he => {
    return asStringParam('e', he.join(','))
  },
  usPrivacyString: usps => {
    return asStringParam('us_privacy', usps)
  },
  wrapperName: wrapper => {
    return asStringParam('wpn', wrapper)
  },
  gdprApplies: gdprApplies => {
    return asParamOrEmpty('gdpr', gdprApplies, (s) => encodeURIComponent(s ? 1 : 0))
  },
  gdprConsent: gdprConsentString => {
    return asStringParam('gdpr_consent', gdprConsentString)
  },
  referrer: referrer => {
    return asStringParam('refr', referrer)
  }
}

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
    const source = isObject(_state.eventSource) ? _state.eventSource : {}
    const eventKeys = Object.keys(source)
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
    return new StateWrapper(merge(state, newInfo))
  }

  /**
   * @returns {string [][]}
   * @private
   */
  function _asTuples () {
    let array = []
    Object.keys(_state).forEach((key) => {
      const value = _state[key]
      if (_pMap[key]) {
        const params = _pMap[key](value)
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
  function _asQueryString () {
    return toParams(_asTuples())
  }

  return {
    data: _state,
    combineWith: _combineWith,
    asQueryString: _asQueryString,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
  }
}
