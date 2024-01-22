import { base64UrlEncode } from '../utils/b64'
import { replacer } from './stringify'
import { fiddle, mergeObjects } from './fiddler'
import { isObject, trim, isArray, nonNull, onNonNull } from 'live-connect-common'
import { QueryBuilder, encodeIdCookie } from '../utils/query'
import { EventBus, State } from '../types'
import { collectUrl } from './url-collector'

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

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

  combineWith(newInfo: Partial<State>): StateWrapper {
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

  asQuery(): QueryBuilder {
    const state = this.data

    const builder = new QueryBuilder()
      .addOptionalParam('aid', state.appId)
      .addOptionalParam('did', state.distributorId)
      .addOptionalParam('se', onNonNull(state.eventSource, s => base64UrlEncode(JSON.stringify(s, replacer))))
      .addOptionalParam('duid', state.liveConnectId)
      .addOptionalParam('tv', state.trackerVersion)

    if (nonNull(state.pageUrl)) {
      const [url, isPathRemoved, blockedParams] = collectUrl(state)
      builder
        .addParam('pu', url)
        .addOptionalParam('pu_rp', isPathRemoved ? '1' : undefined)
        .addParam('pu_rqp', blockedParams.join(','))
    }

    builder.addOptionalParam('ae', onNonNull(state.errorDetails, ed => base64UrlEncode(JSON.stringify(ed))))

    if (isArray(state.retrievedIdentifiers)) {
      state.retrievedIdentifiers.forEach((i) => builder.addParam(`ext_${i.name}`, i.value))
    }

    if (isArray(state.hashesFromIdentifiers)) {
      state.hashesFromIdentifiers.forEach((h) => builder.addParam('scre', `${h.md5},${h.sha1},${h.sha256}`))
    }

    builder
      .addOptionalParam('li_did', state.decisionIds?.join(','))
      .addOptionalParam('e', state.hashedEmail?.join(','))
      .addOptionalParam('us_privacy', state.usPrivacyString)
      .addOptionalParam('wpn', state.wrapperName)
      .addOptionalParam('gdpr', onNonNull(state.gdprApplies, v => v ? '1' : '0'))
      .addOptionalParam('n3pc', state.privacyMode ? '1' : undefined)
      .addOptionalParam('n3pct', state.privacyMode ? '1' : undefined)
      .addOptionalParam('nb', state.privacyMode ? '1' : undefined)
      .addOptionalParam('gdpr_consent', state.gdprConsent)
      .addOptionalParam('refr', state.referrer)
      .addOptionalParam('c', state.contextElements)
      .addOptionalParam('gpp_s', state.gppString)
      .addOptionalParam('gpp_as', state.gppApplicableSections?.join(','))
      .addOptionalParam('cd', state.cookieDomain)
      .addOptionalParam('ic', encodeIdCookie(state.resolvedIdCookie), { stripEmpty: false })

    return builder
  }
}
