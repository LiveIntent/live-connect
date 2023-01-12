import { base64UrlEncode } from '../utils/b64'
import { replacer } from './stringify'
import { fiddle } from './fiddler'
import { isObject, trim, asStringParam, asParamOrEmpty, asStringParamWhen, asStringParamTransform, isArray, merge } from '../utils/types'
import { toParams } from '../utils/url'
import { EventBus, State } from '../types'

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

const _pArray: [string, (value: any) => [string, string][]][] = [
  [
    'appId',
    aid => {
      return asStringParam('aid', aid)
    }
  ],
  [
    'distributorId',
    did => {
      return asStringParam('did', did)
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
        identifiers.forEach((i) => identifierParams.push(...asStringParam(`ext_${i.name}`, i.value)))
      }
      return identifierParams
    }
  ],
  [
    'hashesFromIdentifiers',
    hashes => {
      const hashParams = []
      if (isArray(hashes)) {
        hashes.forEach((h) => hashParams.push(...asStringParam('scre', `${h.md5},${h.sha1},${h.sha256}`)))
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

export class Query {
  tuples: [string, string][];

  constructor (tuples: [string, string][]) {
    this.tuples = tuples
  }

  prependParams (...params: [string, string][]): Query {
    const _tuples = this.tuples
    _tuples.unshift(...params)
    return new Query(_tuples)
  }

  toQueryString (): string {
    return toParams(this.tuples)
  }
}

export class StateWrapper {
  data: State
  eventBus: EventBus

  constructor (state: State, eventBus: EventBus) {
    this.data = StateWrapper.safeFiddle(state, eventBus)
    this.eventBus = eventBus
  }

  private static safeFiddle (newInfo: State, eventBus: EventBus): State {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)))
    } catch (e) {
      console.error(e)
      eventBus.emitErrorWithMessage('StateCombineWith', 'Error while extracting event data', e)
      return {}
    }
  }

  combineWith (newInfo: State): StateWrapper {
    return new StateWrapper(merge(this.data, newInfo), this.eventBus)
  }

  sendsPixel () {
    const source = isObject(this.data.eventSource) ? this.data.eventSource : {}
    const eventKeys = Object.keys(source)
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event')
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0]
    const eventName = eventKey && trim(this.data.eventSource[eventKey])
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }

  asTuples (): [string, string][] {
    let array: [string, string][] = []
    _pArray.forEach((keyWithParamsExtractor) => {
      const key = keyWithParamsExtractor[0]
      const value = this.data[key]
      const params = keyWithParamsExtractor[1](value)
      if (params && params.length) {
        array = array.concat(params)
      }
    })
    return array
  }

  asQuery (): Query {
    return new Query(this.asTuples())
  }
}
