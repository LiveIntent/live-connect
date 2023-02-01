import { replaceEmailsWithHashes } from '../utils/email'
import { safeToString, isString, isArray } from '../utils/types'
import { EventBus, HashedEmail, State, RetrievedIdentifier } from '../types'
import { MinimalStorageHandler } from '../handlers/storage-handler'

export function enrich (state: State, storageHandler: MinimalStorageHandler, eventBus: EventBus): State {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler)
  } catch (e) {
    if (eventBus) {
      eventBus.emitError('IdentifiersEnricher', e)
    }
    return {}
  }
}

function _parseIdentifiersToResolve (state: State): string[] {
  let cookieNames: string[] = []
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

function _getIdentifiers (cookieNames: string[], storageHandler: MinimalStorageHandler): State {
  const identifiers: RetrievedIdentifier[] = []
  let hashes: HashedEmail[] = []
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
  const seen = new Set<string>()
  const result: HashedEmail[] = []
  for (let i = 0; i < hashes.length; i++) {
    if (!seen.has(hashes[i].md5)) {
      result.push(hashes[i])
      seen.add(hashes[i].md5)
    }
  }
  return result
}
