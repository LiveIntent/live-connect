import { replaceEmailsWithHashes } from '../utils/email'
import { safeToString, isString, isArray } from '../utils/types'
import * as emitter from '../utils/emitter'
import { HashedEmail, IMinimalStorageHandler, State } from '../types'

export function enrich (state: State, storageHandler: IMinimalStorageHandler) {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler)
  } catch (e) {
    emitter.fromError('IdentifiersEnricher', e)
    return {}
  }
}

function _parseIdentifiersToResolve (state: State): string[] {
  let cookieNames = []
  if (state.identifiersToResolve) {
    if (isArray(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve as string[]
    } else if (isString(state.identifiersToResolve)) {
      cookieNames = (state.identifiersToResolve as string).split(',')
    }
  }
  for (let i = 0; i < cookieNames.length; i++) {
    cookieNames[i] = cookieNames[i].trim()
  }
  return cookieNames
}

function _getIdentifiers (cookieNames: string[], storageHandler: IMinimalStorageHandler): State {
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

function _deduplicateHashes (hashes: HashedEmail[]): HashedEmail[] {
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
