import { replaceEmailsWithHashes } from '../utils/email.js'
import { safeToString, isString, isArray } from 'live-connect-common'
import { EventBus, HashedEmail, RetrievedIdentifier, Enricher } from '../types.js'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler.js'

type Input = { identifiersToResolve: string | string[] }
type Output = { retrievedIdentifiers: RetrievedIdentifier[], hashesFromIdentifiers: HashedEmail[] }

export function enrichIdentifiers(
  storageHandler: WrappedReadOnlyStorageHandler,
  eventBus: EventBus
): Enricher<Input, Output> {
  return state => {
    try {
      return { ...state, ...getIdentifiers(parseIdentifiersToResolve(state.identifiersToResolve), storageHandler) }
    } catch (e) {
      eventBus.emitError('IdentifiersEnricher', e)
      return { ...state, retrievedIdentifiers: [], hashesFromIdentifiers: [] }
    }
  }
}

function parseIdentifiersToResolve(identifiersToResolve: string | string[]): string[] {
  let cookieNames: string[] = []
  if (identifiersToResolve) {
    if (isArray(identifiersToResolve)) {
      cookieNames = identifiersToResolve as string[]
    } else if (isString(identifiersToResolve)) {
      cookieNames = (identifiersToResolve as string).split(',')
    }
  }
  for (let i = 0; i < cookieNames.length; i++) {
    cookieNames[i] = cookieNames[i].trim()
  }
  return cookieNames
}

function getIdentifiers(cookieNames: string[], storageHandler: WrappedReadOnlyStorageHandler): Output {
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
    hashesFromIdentifiers: deduplicateHashes(hashes)
  }
}

function deduplicateHashes(hashes: HashedEmail[]): HashedEmail[] {
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
