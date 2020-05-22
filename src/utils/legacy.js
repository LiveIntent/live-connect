import { domainHash } from './hash'
import { loadedDomain } from './page'
import { UUID } from './types'

const APP_ID = '[a-z]-[a-z0-9]{4}'
const NUMBERS = '\\+?\\d+'

const LEGACY_COOKIE_FORMAT = `(${APP_ID}--${UUID})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${NUMBERS})\\.(${UUID})`
const LEGACY_COOKIE_REGEX = new RegExp(LEGACY_COOKIE_FORMAT, 'i')
const LEGACY_IDENTIFIER_PREFIX = '_litra_id.'

function _fixupDomain (domain) {
  let dl = domain.length
  // remove trailing '.'
  if (domain.charAt(--dl) === '.') {
    domain = domain.slice(0, dl)
  }
  // remove leading '*'
  if (domain.slice(0, 2) === '*.') {
    domain = domain.slice(1)
  }
  return domain
}

export function getLegacyIdentifierKey () {
  const domain = loadedDomain()
  const domainKey = domainHash(_fixupDomain(domain) + '/', 4)
  return `${LEGACY_IDENTIFIER_PREFIX}${domainKey}`
}

/**
 * @return {LegacyId|null|undefined}
 * @private
 */
export function getLegacyId (entry) {
  if (entry) {
    const matches = entry.match(LEGACY_COOKIE_REGEX)
    if (matches && matches.length === 7) {
      return {
        duid: matches[1],
        creationTs: matches[2],
        sessionCount: matches[3],
        currVisitTs: matches[4],
        lastSessionVisitTs: matches[5],
        sessionId: matches[6]
      }
    }
  }
}
