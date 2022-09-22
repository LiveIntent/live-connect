import * as emitter from '../utils/emitter'
import { base64UrlEncode } from '../utils/b64'
import { replacer } from './stringify'
import { fiddle } from './fiddler'
import { isObject, trim, merge, asStringParam, asParamOrEmpty, asStringParamWhen, asStringParamTransform, isArray, asParamOrEmptyTransform } from '../utils/types'
import { toParams } from '../utils/url'
import { ErrorDetails } from '../events/error-pixel'
import { HashedEmail } from '../utils/hash'
import { IdentityResolutionConfig, LiveConnectConfig } from '../types'

export interface State extends LiveConnectConfig {
  eventSource?: object,
  liveConnectId?: string,
  trackerName?: string,
  pageUrl?: string,
  domain?: string,
  hashesFromIdentifiers?: HashedEmail[],
  decisionIds?: string[],
  peopleVerifiedId?: string,
  errorDetails?: ErrorDetails,
  retrievedIdentifiers?: string[], // TODO: RetrievedIdentifiers[]
  hashedEmail?: HashedEmail[],
  providedHash?: string,
  gdprConsent?: string,
<<<<<<< Updated upstream
  contextSelectors?: string,
=======
  contextSelectors?: string | string[],
>>>>>>> Stashed changes
  contextElementsLength?: number,
  contextElements?: string,
  privacyMode?: boolean,
  referrer?: string
}

type ParamOrEmpty = [string, string][] | [string, string] | []

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

const _pArray: ((value: State) => ParamOrEmpty)[] = [
  state => {
    return asStringParam('aid', state.appId)
  },
  state => {
    return asParamOrEmptyTransform('se', state.eventSource, (s) => base64UrlEncode(JSON.stringify(s, replacer)))
  },
  state => {
    return asStringParam('duid', state.liveConnectId)
  },
  state => {
    return asStringParam('tna', state.trackerName)
  },
  state => {
    return asStringParam('pu', state.pageUrl)
  },
  state => {
    return asParamOrEmptyTransform('ae', state.errorDetails, (s) => base64UrlEncode(JSON.stringify(s)))
  },
  state => {
    const identifiers = state.retrievedIdentifiers
    const identifierParams = []
    if (isArray(identifiers)) {
      identifiers.forEach((i) => identifierParams.push(asStringParam(`ext_${i.name}`, i.value)))
    }
    return identifierParams
  },
  state => {
    const hashes = state.hashesFromIdentifiers
    const hashParams = []
    if (isArray(hashes)) {
      hashes.forEach((h) => hashParams.push(asStringParam('scre', `${h.md5},${h.sha1},${h.sha256}`)))
    }
    return hashParams
  },
  state => {
    return asStringParamTransform('li_did', state.decisionIds, (s) => s.join(','))
  },
  state => {
    return asStringParamTransform('e', state.hashedEmail, (s) => s.join(','))
  },
  state => {
    return asStringParam('us_privacy', state.usPrivacyString)
  },
  state => {
    return asStringParam('wpn', state.wrapperName)
  },
  state => {
    return asStringParamTransform('gdpr', state.gdprApplies, (s) => s ? 1 : 0)
  },
  state => {
    return asStringParamWhen('n3pc', state.privacyMode ? '1' : '0', v => v === '1')
  },
  state => {
    return asStringParamWhen('n3pct', state.privacyMode ? '1' : '0', v => v === '1')
  },
  state => {
    return asStringParamWhen('nb', state.privacyMode ? '1' : '0', v => v === '1')
  },
  state => {
    return asStringParam('gdpr_consent', state.gdprConsent)
  },
  state => {
    return asStringParam('refr', state.referrer)
  },
  state => {
    return asStringParam('c', state.contextElements)
  }
]

export class Query {
  tuples: [string, string][]

  constructor (tuples: [string, string][]) {
    this.tuples = tuples
  }

  prependParam (tuple: [string, string]): Query {
    const _tuples = this.tuples
    _tuples.unshift(tuple)
    return new Query(_tuples)
  }

  toQueryString () {
    return toParams(this.tuples)
  }
}

export class StateWrapper {
  data: State

  constructor (state?: State) {
    if (state) {
      this.data = this._safeFiddle(state)
    } else {
      this.data = {}
    }
  }

  sendsPixel () {
    const source = isObject(this.data.eventSource) ? this.data.eventSource : {}
    const eventKeys = Object.keys(source)
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event')
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0]
    const eventName = eventKey && trim(this.data.eventSource[eventKey])
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }

  combineWith (newInfo: State): StateWrapper {
    return new StateWrapper(merge(this.data, newInfo))
  }

  asTuples (): [string, string][] {
    let array = []
    _pArray.forEach((keyWithParamsExtractor) => {
      const params = keyWithParamsExtractor[1](this.data)
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

  asQuery () {
    return new Query(this.asTuples())
  }

  _safeFiddle (newInfo: object): object {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)))
    } catch (e) {
      console.error(e)
      emitter.error('StateCombineWith', 'Error while extracting event data', e)
      return this.data
    }
  }
}
