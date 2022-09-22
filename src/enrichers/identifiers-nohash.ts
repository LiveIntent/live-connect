import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim } from '../utils/types'
import * as emitter from '../utils/emitter'
import { State } from '../pixel/state'
import { MinimalStorageHandler } from '../handlers/types'

export function enrich (state: State, storageHandler: MinimalStorageHandler): State {
  try {
    return _parseIdentifiersToResolve(state, storageHandler)
  } catch (e) {
    emitter.fromError('IdentifiersEnrich', e)
    return {}
  }
}

function _parseIdentifiersToResolve (state: State, storageHandler: MinimalStorageHandler): State {
  state.identifiersToResolve = state.identifiersToResolve || []
  const cookieNames = isArray(state.identifiersToResolve) ? state.identifiersToResolve : safeToString(state.identifiersToResolve).split(',')
  const identifiers = []
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
