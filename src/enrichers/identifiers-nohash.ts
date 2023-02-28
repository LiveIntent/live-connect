import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim } from 'live-connect-common'
import { EventBus, RetrievedIdentifier, State } from '../types'
import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'

export function enrich(state: State, storageHandler: WrappedReadOnlyStorageHandler, eventBus: EventBus): State {
  try {
    return _parseIdentifiersToResolve(state, storageHandler)
  } catch (e) {
    eventBus.emitError('IdentifiersEnrich', e)
    return {}
  }
}

function _parseIdentifiersToResolve(state: State, storageHandler: WrappedReadOnlyStorageHandler): State {
  state.identifiersToResolve = state.identifiersToResolve || []
  const cookieNames = isArray(state.identifiersToResolve) ? state.identifiersToResolve : safeToString(state.identifiersToResolve).split(',')
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
  return {
    retrievedIdentifiers: identifiers
  }
}
