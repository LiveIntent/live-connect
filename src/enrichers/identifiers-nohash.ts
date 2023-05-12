import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim, EventBus } from 'live-connect-common'
import { RetrievedIdentifier, State } from '../types'
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
  const identifiers: RetrievedIdentifier[] = cookieNames.reduce((arr, name) => {
    const identifierName = trim(name)
    const identifierValue = storageHandler.getCookie(identifierName) || storageHandler.getDataFromLocalStorage(identifierName)
    if (identifierValue && !containsEmailField(safeToString(identifierValue)) && !isEmail(safeToString(identifierValue))) {
      return [
        ...arr,
        {
          name: identifierName,
          value: safeToString(identifierValue)
        }
      ]
    }
    return arr
  }, [] as RetrievedIdentifier[])
  return {
    retrievedIdentifiers: identifiers
  }
}
