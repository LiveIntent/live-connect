import { base64UrlEncode } from '../utils/b64.js'
import { replacer } from './stringify.js'
import { fiddle, mergeObjects } from './fiddler.js'
import { isObject, trim, isArray, nonNull, onNonNull, Headers } from 'live-connect-common'
import { QueryBuilder, encodeIdCookie } from '../utils/query.js'
import { EventBus, FiddledState, State } from '../types.js'
import { collectUrl } from './url-collector.js'

const noOpEvents = ['setemail', 'setemailhash', 'sethashedemail']

export class StateWrapper {
  data: FiddledState

  constructor (state: State, eventSource: object, eventBus?: EventBus) {
    this.data = StateWrapper.safeFiddle(state, eventSource, eventBus)
  }

  private static safeFiddle(state: State, eventSource: object, eventBus?: EventBus): FiddledState {
    try {
      return mergeObjects(state, fiddle(JSON.parse(JSON.stringify(eventSource))))
    } catch (e) {
      console.error(e)
      if (eventBus != null) {
        eventBus.emitErrorWithMessage('StateCombineWith', 'Error while extracting event data', e)
      }
      return {}
    }
  }

  setHashedEmail(hashedEmail: string[]): void {
    this.data.hashedEmail = hashedEmail
  }

  getHashedEmail(): string[] {
    return this.data.hashedEmail || []
  }

  sendsPixel() {
    const source = isObject(this.data.eventSource) ? this.data.eventSource : {}
    const eventKeys = Object.keys(source)
      .filter(objKey => objKey.toLowerCase() === 'eventname' || objKey.toLowerCase() === 'event')
    const eventKey = eventKeys && eventKeys.length >= 1 && eventKeys[0]
    const eventName = eventKey && trim(source[eventKey as keyof typeof source])
    return !eventName || noOpEvents.indexOf(eventName.toLowerCase()) === -1
  }

  asHeaders(): Headers {
    return {
      'X-LI-Provided-User-Agent': this.data.providedUserAgent
    }
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
      .addOptional('pip', onNonNull(state.providedIPV4, v => base64UrlEncode(v)))
      .addOptional('pip6', onNonNull(state.providedIPV6, v => base64UrlEncode(v)))

    return builder
  }
}
