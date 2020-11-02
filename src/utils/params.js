import * as b64 from './b64'
import { replacer } from '../pixel/stringify'
import { isFunction, isNonEmpty } from './types'

function _asParamOrEmpty (param, value, transform) {
  if (isNonEmpty(value)) {
    return [param, isFunction(transform) ? transform(value) : value]
  } else {
    return []
  }
}

function _param (key, value) {
  return _asParamOrEmpty(key, value, (s) => encodeURIComponent(s))
}

export const params = {
  appId: aid => {
    return _param('aid', aid)
  },
  eventSource: source => {
    return _asParamOrEmpty('se', source, (s) => b64.base64UrlEncode(JSON.stringify(s, replacer)))
  },
  liveConnectId: fpc => {
    return _param('duid', fpc)
  },
  legacyId: legacyFpc => {
    return _param('lduid', legacyFpc && legacyFpc.duid)
  },
  trackerName: tn => {
    return _param('tna', tn || 'unknown')
  },
  pageUrl: purl => {
    return _param('pu', purl)
  },
  errorDetails: ed => {
    return _asParamOrEmpty('ae', ed, (s) => b64.base64UrlEncode(JSON.stringify(s)))
  },
  retrievedIdentifiers: identifiers => {
    const identifierParams = []
    for (let i = 0; i < identifiers.length; i++) {
      identifierParams.push(_asParamOrEmpty(`ext_${identifiers[i].name}`, identifiers[i].value, (s) => encodeURIComponent(s)))
    }
    return identifierParams
  },
  hashesFromIdentifiers: hashes => {
    const hashParams = []
    for (let i = 0; i < hashes.length; i++) {
      hashParams.push(_asParamOrEmpty('scre', hashes[i], h => `${h.md5},${h.sha1},${h.sha256}`))
    }
    return hashParams
  },
  decisionIds: dids => {
    return _param('li_did', dids.join(','))
  },
  hashedEmail: he => {
    return _param('e', he.join(','))
  },
  usPrivacyString: usps => {
    return _param('us_privacy', usps && encodeURIComponent(usps))
  },
  wrapperName: wrapper => {
    return _param('wpn', wrapper && encodeURIComponent(wrapper))
  },
  gdprApplies: gdprApplies => {
    return _asParamOrEmpty('gdpr', gdprApplies, (s) => encodeURIComponent(s ? 1 : 0))
  },
  gdprConsent: gdprConsentString => {
    return _param('gdpr_consent', gdprConsentString && encodeURIComponent(gdprConsentString))
  },
  referrer: referrer => {
    return _param('refr', referrer)
  }
}
