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

    // roughly add parameters in order of importance as the url might get truncated
    const builder = new QueryBuilder()
      .addOptional('aid', state.appId)
      .addOptional('did', state.distributorId)
      .addOptional('se', onNonNull(state.eventSource, s => base64UrlEncode(JSON.stringify(s, replacer))))
      .addOptional('duid', state.liveConnectId)
      .addOptional('tv', state.trackerVersion)

    if (nonNull(state.pageUrl)) {
      const [url, isPathRemoved, blockedParams] = collectUrl(state)
      builder
        .add('pu', url)
        .addOptional('pu_rp', isPathRemoved ? '1' : undefined)
        .add('pu_rqp', blockedParams.join(','))
    }

    builder.addOptional('ae', onNonNull(state.errorDetails, ed => base64UrlEncode(JSON.stringify(ed))))

    if (isArray(state.retrievedIdentifiers)) {
      state.retrievedIdentifiers.forEach((i) => builder.add(`ext_${i.name}`, i.value))
    }

    if (isArray(state.hashesFromIdentifiers)) {
      state.hashesFromIdentifiers.forEach((h) => builder.add('scre', `${h.md5},${h.sha1},${h.sha256}`))
    }

    builder
      .addOptional('li_did', state.decisionIds?.join(','))
      .addOptional('e', state.hashedEmail?.join(','))
      .addOptional('us_privacy', state.usPrivacyString)
      .addOptional('wpn', state.wrapperName)
      .addOptional('gdpr', onNonNull(state.gdprApplies, v => v ? '1' : '0'))
      .addOptional('gdpr_consent', state.gdprConsent)
      .addOptional('refr', state.referrer)
      .addOptional('gpp_s', state.gppString)
      .addOptional('gpp_as', state.gppApplicableSections?.join(','))
      .addOptional('cd', state.cookieDomain)
      .addOptional('ic', encodeIdCookie(state.resolvedIdCookie), { stripEmpty: false })
      .addOptional('c', state.contextElements)

    return builder
  }
}
