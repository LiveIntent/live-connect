import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim } from '../utils/types'
import { EventBus, IMinimalStorageHandler, RetrievedIdentifier, State } from '../types'

export function enrich (state: State, storageHandler: IMinimalStorageHandler, eventBus: EventBus): State {
  try {
    return _parseIdentifiersToResolve(state, storageHandler)
  } catch (e) {
    eventBus.emitError('IdentifiersEnrich', e)
    return {}
  }
}

function _parseIdentifiersToResolve (state: State, storageHandler: IMinimalStorageHandler): State {
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
