import * as Ulid from '@kiosked/ulid'
import * as emitter from '../utils/emitter'
import { getCookie, getFromLs, getOrAddWithExpiration, setCookie } from '../utils/storage'
import { isIframe, loadedDomain, parentHostname } from '../utils/page'
import { getLegacyId, getLegacyIdentifierKey } from '../utils/legacy'
import { domainHash } from '../utils/hash'

const NEXT_GEN_FP_NAME = '_lc2_duid'
const TLD_CACHE_KEY = '_li_dcdm_c'

const DEFAULT_EXPIRATION_DAYS = 730

/**
 *
 * @returns {string}
 */
export function determineTld () {
  const cachedDomain = getCookie(TLD_CACHE_KEY)
  if (cachedDomain) {
    return cachedDomain
  }
  const domain = loadedDomain()
  const arr = domain.split('.').reverse()
  for (let i = 1; i < arr.length; i++) {
    const newD = `.${arr.slice(0, i).reverse().join('.')}`
    setCookie(TLD_CACHE_KEY, newD, { domain: newD })
    if (getCookie(TLD_CACHE_KEY)) {
      return newD
    }
  }
  return `.${domain}`
}

/**
 * @return {LegacyId|null|undefined}
 * @private
 */
function _legacyDuid () {
  const _legacyEntry = getFromLs(getLegacyIdentifierKey())
  return getLegacyId(_legacyEntry)
}

/**
 * @param {string} apexDomain
 * @returns {string}
 * @private
 */
function _generateCookie (apexDomain) {
  const ulid = Ulid.ulid()
  let cookie
  if (isIframe()) {
    cookie = `${domainHash(apexDomain)}-${domainHash(parentHostname())}--${ulid}`
  } else {
    cookie = `${domainHash(apexDomain)}--${ulid}`
  }
  return cookie.toLocaleLowerCase()
}

/**
 * @param {State} state
 */
export function resolve (state) {
  try {
    console.log('identifiers.resolve', state)
    const expiry = state.expirationDays || DEFAULT_EXPIRATION_DAYS
    const cookieDomain = determineTld()
    let providedFirstPartyIdentifier = null
    if (state.providedIdentifierName) {
      providedFirstPartyIdentifier = getCookie(state.providedIdentifierName) ||
        getFromLs(state.providedIdentifierName)
    }
    const storageOptions = {
      expires: expiry,
      domain: cookieDomain
    }
    const legacyDuid = _legacyDuid()
    const liveConnectIdentifier = getOrAddWithExpiration(
      NEXT_GEN_FP_NAME,
      _generateCookie(cookieDomain),
      storageOptions,
      state.storageStrategy)
    return {
      domain: cookieDomain,
      legacyId: legacyDuid,
      liveConnectId: liveConnectIdentifier,
      providedIdentifier: providedFirstPartyIdentifier
    }
  } catch (e) {
    emitter.error('IdentifiersResolve', 'Error while managing identifiers', e)
    return {}
  }
}
