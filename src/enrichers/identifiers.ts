import { replaceEmailsWithHashes } from '../utils/email'
import { EventBus, safeToString, isString, isArray } from 'live-connect-common'
import { HashedEmail, State, RetrievedIdentifier } from '../types'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'

export function enrich(state: State, storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus): State {
  try {
    return _getIdentifiers(_parseIdentifiersToResolve(state), storageHandler)
  } catch (e) {
    if (eventBus) {
      eventBus.emitError('IdentifiersEnricher', e)
    }
    return {}
  }
}

function _parseIdentifiersToResolve(state: State): string[] {
  let cookieNames: string[] = []
  if (state.identifiersToResolve) {
    if (isArray(state.identifiersToResolve)) {
      cookieNames = state.identifiersToResolve as string[]
    } else if (isString(state.identifiersToResolve)) {
      cookieNames = (state.identifiersToResolve as string).split(',')
    }
  }
  return cookieNames.map(x => x.trim())
}

function _getIdentifiers(cookieNames: string[], storageHandler: WrappedReadOnlyStorageHandler): State {
  const { identifiers, hashes } = cookieNames
    .reduce(({ identifiers, hashes }, identifierName) => {
      const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName)
      if (identifierValue) {
        const cookieAndHashes = replaceEmailsWithHashes(safeToString(identifierValue))
        return {
          identifiers: [
            ...identifiers,
            {
              name: identifierName,
              value: cookieAndHashes.stringWithoutRawEmails
            }
          ],
          hashes: [
            ...hashes,
            ...cookieAndHashes.hashesFromOriginalString
          ]
        }
      }
      return { identifiers, hashes }
    }, {
      identifiers: [] as RetrievedIdentifier[],
      hashes: [] as HashedEmail[]
    })

  return {
    retrievedIdentifiers: identifiers,
    hashesFromIdentifiers: _deduplicateHashes(hashes)
  }
}

function _deduplicateHashes(hashes: HashedEmail[]): HashedEmail[] {
  const seen = new Set<string>()
  return hashes.reduce((r, h) => {
    if (!seen.has(h.md5)) {
      seen.add(h.md5)
      return [...r, h]
    }
    return r
  }, [] as HashedEmail[])
}
