/**
 * @typedef {Object} RetrievedIdentifier
 * @property {string} name
 * @property {string} value
 */
import { replaceEmailsWithHashes } from '../utils/email'
import { safeToString, isString, isArray } from '../utils/types'
import * as emitter from '../utils/emitter'

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]} | {}}
 */
export function enrich (state, storageHandler) {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler)
  } catch (e) {
    emitter.fromError('IdentifiersEnricher', e)
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
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]}}
 * @private
 */
function _getIdentifiers (cookieNames, storageHandler) {
  const identifiers = []
  let hashes = []
  for (let i = 0; i < cookieNames.length; i++) {
    const identifierName = cookieNames[i]
    const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName)
    if (identifierValue) {
      const cookieAndHashes = replaceEmailsWithHashes(safeToString(identifierValue))
      identifiers.push({
        name: identifierName,
        value: cookieAndHashes.stringWithoutRawEmails
      })
      hashes = hashes.concat(cookieAndHashes.hashesFromOriginalString)
    }
  }
  return {
    retrievedIdentifiers: identifiers,
    hashesFromIdentifiers: _deduplicateHashes(hashes)
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
