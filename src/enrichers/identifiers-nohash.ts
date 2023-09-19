import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim } from 'live-connect-common'
import { Enricher, EventBus, RetrievedIdentifier } from '../types'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'

type Input = { identifiersToResolve: string | string[] }
type Output = { retrievedIdentifiers: RetrievedIdentifier[] }

export function enrichIdentifiers(storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus): Enricher<Input, Output> {
  return state => {
    try {
      return { ...state, retrievedIdentifiers: resolveIdentifiers(state.identifiersToResolve, storageHandler) }
    } catch (e) {
      eventBus.emitError('IdentifiersEnrich', e)
      return { ...state, retrievedIdentifiers: [] }
    }
  }
}

function resolveIdentifiers(identifiersToResolve: string | string[], storageHandler: WrappedReadOnlyStorageHandler): RetrievedIdentifier[] {
  const cookieNames = isArray(identifiersToResolve) ? identifiersToResolve : safeToString(identifiersToResolve).split(',')
  const identifiers: RetrievedIdentifier[] = []
  for (let i = 0; i < cookieNames.length; i++) {
    const identifierName = trim(cookieNames[i])
    const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName)
    if (identifierValue && !containsEmailField(safeToString(identifierValue)) && !isEmail(safeToString(identifierValue))) {
      identifiers.push({
        name: identifierName,
        value: safeToString(identifierValue)
      })
    }
  }
  return identifiers
}
