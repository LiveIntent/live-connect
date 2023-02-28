import { base64UrlEncode } from '../utils/b64'
import { replacer } from './stringify'
import { fiddle, mergeObjects } from './fiddler'
import { isObject, trim, isArray, nonNull } from 'live-connect-common'
import { asStringParam, asParamOrEmpty, asStringParamWhen, asStringParamTransform } from '../utils/params'
import { toParams } from '../utils/url'
import { EventBus, State } from '../types'

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

function ifDefined<K extends keyof State>(key: K, fun: (value: NonNullable<State[K]>) => [string, string][]): (state: State) => [string, string][] {
  return state => {
    const value = state[key]
    if (nonNull(value)) {
      return fun(value)
    } else {
      return []
    }
  }
}

const paramExtractors: ((state: State) => [string, string][])[] = [
  ifDefined('appId', aid => asStringParam('aid', aid)),
  ifDefined('distributorId', did => asStringParam('did', did)),
  ifDefined('eventSource', source => asParamOrEmpty('se', source, (s) => base64UrlEncode(JSON.stringify(s, replacer)))),
  ifDefined('liveConnectId', fpc => asStringParam('duid', fpc)),
  ifDefined('trackerName', tn => asStringParam('tna', tn)),
  ifDefined('pageUrl', purl => asStringParam('pu', purl)),
  ifDefined('errorDetails', ed => asParamOrEmpty('ae', ed, (s) => base64UrlEncode(JSON.stringify(s)))),
  ifDefined('retrievedIdentifiers', identifiers => {
    const identifierParams: [string, string][] = []
    if (isArray(identifiers)) {
      identifiers.forEach((i) => identifierParams.push(...asStringParam(`ext_${i.name}`, i.value)))
    }
    return identifierParams
  }),
  ifDefined('hashesFromIdentifiers', hashes => {
    const hashParams: [string, string][] = []
    if (isArray(hashes)) {
      hashes.forEach((h) => hashParams.push(...asStringParam('scre', `${h.md5},${h.sha1},${h.sha256}`)))
    }
    return hashParams
  }),
  ifDefined('decisionIds', dids => asStringParamTransform('li_did', dids, (s) => s.join(','))),
  ifDefined('hashedEmail', he => asStringParamTransform('e', he, (s) => s.join(','))),
  ifDefined('usPrivacyString', usps => asStringParam('us_privacy', usps)),
  ifDefined('wrapperName', wrapper => asStringParam('wpn', wrapper)),
  ifDefined('gdprApplies', gdprApplies => asStringParamTransform('gdpr', gdprApplies, (s) => s ? 1 : 0)),
  ifDefined('privacyMode', privacyMode => asStringParamWhen('n3pc', privacyMode ? 1 : 0, v => v === 1)),
  ifDefined('privacyMode', privacyMode => asStringParamWhen('n3pct', privacyMode ? 1 : 0, v => v === 1)),
  ifDefined('privacyMode', privacyMode => asStringParamWhen('nb', privacyMode ? 1 : 0, v => v === 1)),
  ifDefined('gdprConsent', gdprConsentString => asStringParam('gdpr_consent', gdprConsentString)),
  ifDefined('referrer', referrer => asStringParam('refr', referrer)),
  ifDefined('contextElements', contextElements => asStringParam('c', contextElements))
]

export class Query {
  tuples: [string, string][]

  constructor (tuples: [string, string][]) {
    this.tuples = tuples
  }

  prependParams(...params: [string, string][]): Query {
    const _tuples = this.tuples
    _tuples.unshift(...params)
    return new Query(_tuples)
  }

  toQueryString(): string {
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

  private static safeFiddle(newInfo: State, eventBus: EventBus): State {
    try {
      return fiddle(JSON.parse(JSON.stringify(newInfo)))
    } catch (e) {
      console.error(e)
      eventBus.emitErrorWithMessage('StateCombineWith', 'Error while extracting event data', e)
      return {}
    }
  }

  combineWith(newInfo: State): StateWrapper {
    return new StateWrapper(mergeObjects(this.data, newInfo), this.eventBus)
  }

  sendsPixel() {
    const source = isObject(this.data.eventSource) ? this.data.eventSource : {}
    const eventKeys = Object.keys(source)
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event')
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0]
    const eventName = eventKey && trim(source[eventKey as keyof typeof source])
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }

  asTuples(): [string, string][] {
    const acc: [string, string][] = []
    paramExtractors.forEach((extractor) => {
      const params = extractor(this.data)
      if (params && isArray(params)) {
        acc.push(...params)
      }
    })
    return acc
  }

  asQuery(): Query {
    return new Query(this.asTuples())
  }
}
