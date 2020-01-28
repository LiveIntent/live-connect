/**
 * @typedef {Object} RetrievedIdentifier
 * @property {string} name
 * @property {string} value
 */

import * as storage from '../utils/storage'
import { containsEmailField, isEmail, listEmailsInString } from '../utils/email'
import { hashEmail } from '../utils/hash'
import { safeToString, isString, isArray } from '../utils/types'
import * as emitter from '../utils/emitter'

/**
 * @param {State} state
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]} | {}}
 */
export function enrich (state) {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state))
  } catch (e) {
    emitter.error('IdentifiersEnricher', 'Error while retrieving fp identifiers', e)
    return {}
  }
}

/**
 * @param {State} state
 * @returns {string[]}
 * @private
 */
function _parseIdentifiersToResolve (state) {
  let cookieNames = []
  if (state.identifiersToResolve) {
    if (isArray(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve
    } else if (isString(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve.split(',')
    }
  }
  for (let i = 0; i < cookieNames.length; i++) {
    cookieNames[i] = cookieNames[i].trim()
  }
  return cookieNames
}

/**
 * @param {string[]} cookieNames
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]}}
 * @private
 */
function _getIdentifiers (cookieNames) {
  const identifiers = []
  let hashes = []
  for (let i = 0; i < cookieNames.length; i++) {
    const identifierName = cookieNames[i]
    const identifierValue = storage.getCookie(identifierName) || storage.getFromLs(identifierName)
    if (identifierValue) {
      const cookieAndHashes = _findAndReplaceRawEmails(safeToString(identifierValue))
      identifiers.push({
        name: identifierName,
        value: cookieAndHashes.identifierWithoutRawEmails
      })
      hashes = hashes.concat(cookieAndHashes.hashesFromIdentifier)
    }
  }
  return {
    retrievedIdentifiers: identifiers,
    hashesFromIdentifiers: _deduplicateHashes(hashes)
  }
}

/**
 * @param {string} cookieValue
 * @returns {{hashesFromIdentifier: HashedEmail[], identifierWithoutRawEmails: string}}
 * @private
 */
function _findAndReplaceRawEmails (cookieValue) {
  if (containsEmailField(cookieValue)) {
    return _replaceEmailsWithHashes(cookieValue)
  } else if (isEmail(cookieValue)) {
    const hashes = hashEmail(cookieValue)
    return {
      identifierWithoutRawEmails: hashes.md5,
      hashesFromIdentifier: [hashes]
    }
  } else {
    return {
      identifierWithoutRawEmails: cookieValue,
      hashesFromIdentifier: []
    }
  }
}

/**
 *
 * @param cookieValue
 * @returns {{hashesFromIdentifier: HashedEmail[], identifierWithoutRawEmails: string}}
 * @private
 */
function _replaceEmailsWithHashes (cookieValue) {
  const emailsInCookie = listEmailsInString(cookieValue)
  const hashes = []
  for (let i = 0; i < emailsInCookie.length; i++) {
    const email = emailsInCookie[i]
    const emailHashes = hashEmail(email)
    cookieValue = cookieValue.replace(email, emailHashes.md5)
    hashes.push(emailHashes)
  }
  return {
    identifierWithoutRawEmails: cookieValue,
    hashesFromIdentifier: hashes
  }
}

/**
 * @param {HashedEmail[]} hashes
 * @returns {HashedEmail[]}
 * @private
 */
function _deduplicateHashes (hashes) {
  const seen = {}
  const result = []
  for (let i = 0; i < hashes.length; i++) {
    if (!(hashes[i].md5 in seen)) {
      result.push(hashes[i])
      seen[hashes[i].md5] = true
    }
  }
  return result
}
