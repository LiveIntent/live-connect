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
 * @property {ErrorDetails} [errorDetails]
 * @property {RetrievedIdentifier[]} [retrievedIdentifiers]
 * @property {HashedEmail[]} [hashedEmail]
 * @property {string} [providedHash]
 * @property {(IdexConfig|undefined)} [identityResolutionConfig]
 * @property {(boolean|undefined)} [gdprApplies]
 * @property {(string|undefined)} [gdprConsent]
 * @property {(string|undefined)} [contextSelectors]
 * @property {(string|undefined)} [contextElementsLength]
 * @property {(string|undefined)} [contextElements]
 * @property {(boolean|undefined)} [privacyMode]
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
import { isObject, trim, merge, asStringParam, asParamOrEmpty, asStringParamWhen, asStringParamTransform, isArray } from '../utils/types'
import { toParams } from '../utils/url'

/**
 * @param {string} param
 * @param {string|null} value
 * @param {function} transform
 * @return {*[]|Array}
 * @private
 */

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

const _pArray = [
  [
    'appId',
    aid => {
      return asStringParam('aid', aid)
    }
  ],
  [
    'eventSource',
    source => {
      return asParamOrEmpty('se', source, (s) => base64UrlEncode(JSON.stringify(s, replacer)))
    }
  ],
  [
    'liveConnectId',
    fpc => {
      return asStringParam('duid', fpc)
    }
  ],
  [
    'trackerName',
    tn => {
      return asStringParam('tna', tn)
    }
  ],
  [
    'pageUrl',
    purl => {
      return asStringParam('pu', purl)
    }
  ],
  [
    'errorDetails',
    ed => {
      return asParamOrEmpty('ae', ed, (s) => base64UrlEncode(JSON.stringify(s)))
    }
  ],
  [
    'retrievedIdentifiers',
    identifiers => {
      const identifierParams = []
      if (isArray(identifiers)) {
        identifiers.forEach((i) => identifierParams.push(asStringParam(`ext_${i.name}`, i.value)))
      }
      return identifierParams
    }
  ],
  [
    'hashesFromIdentifiers',
    hashes => {
      const hashParams = []
      if (isArray(hashes)) {
        hashes.forEach((h) => hashParams.push(asStringParam('scre', `${h.md5},${h.sha1},${h.sha256}`)))
      }
      return hashParams
    }
  ],
  ['decisionIds',
    dids => {
      return asStringParamTransform('li_did', dids, (s) => s.join(','))
    }
  ],
  [
    'hashedEmail',
    he => {
      return asStringParamTransform('e', he, (s) => s.join(','))
    }
  ],
  [
    'usPrivacyString',
    usps => {
      return asStringParam('us_privacy', usps)
    }
  ],
  [
    'wrapperName',
    wrapper => {
      return asStringParam('wpn', wrapper)
    }
  ],
  [
    'gdprApplies',
    gdprApplies => {
      return asStringParamTransform('gdpr', gdprApplies, (s) => s ? 1 : 0)
    }
  ],
  [
    'privacyMode',
    privacyMode => {
      return asStringParamWhen('n3pc', privacyMode ? 1 : 0, v => v === 1)
    }
  ],
  [
    'privacyMode',
    privacyMode => {
      return asStringParamWhen('n3pct', privacyMode ? 1 : 0, v => v === 1)
    }
  ],
  [
    'privacyMode',
    privacyMode => {
      return asStringParamWhen('nb', privacyMode ? 1 : 0, v => v === 1)
    }
  ],
  [
    'gdprConsent',
    gdprConsentString => {
      return asStringParam('gdpr_consent', gdprConsentString)
    }
  ],
  [
    'referrer',
    referrer => {
      return asStringParam('refr', referrer)
    }
  ],
  [
    'contextElements',
    contextElements => {
      return asStringParam('c', contextElements)
    }
  ]
]

/**
 * @param {string [][]} tuples
 * @returns {Query}
 * @constructor
 */
export function Query (tuples) {
  Query.prependParam = function (tuple) {
    const _tuples = tuples
    _tuples.unshift(tuple)
    return new Query(_tuples)
  }

  Query.toQueryString = function () {
    return toParams(tuples)
  }
  return Query
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
    _pArray.forEach((keyWithParamsExtractor) => {
      const key = keyWithParamsExtractor[0]
      const value = _state[key]
      const params = keyWithParamsExtractor[1](value)
      if (params && params.length) {
        if (params[0] instanceof Array) {
          array = array.concat(params)
        } else {
          array.push(params)
        }
      }
    })
    return array
  }

  function _asQuery () {
    return new Query(_asTuples())
  }

  return {
    data: _state,
    combineWith: _combineWith,
    asQuery: _asQuery,
    asTuples: _asTuples,
    sendsPixel: _sendsPixel
  }
}
