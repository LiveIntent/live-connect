import { containsEmailField, isEmail } from '../utils/email'
import { safeToString, isArray, trim } from '../utils/types'
<<<<<<< HEAD:src/enrichers/identifiers-nohash.ts
import * as emitter from '../utils/emitter'
import { IMinimalStorageHandler, State } from '../types'

export function enrich (state: State, storageHandler: IMinimalStorageHandler): State {
=======

/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @param {EventBus} eventBus
 * @returns {{hashesFromIdentifiers: HashedEmail[], retrievedIdentifiers: RetrievedIdentifier[]} | {}}
 */
export function enrich (state, storageHandler, eventBus) {
>>>>>>> master:src/enrichers/identifiers-nohash.js
  try {
    return _parseIdentifiersToResolve(state, storageHandler)
  } catch (e) {
    eventBus.emitError('IdentifiersEnrich', e)
    return {}
  }
}

<<<<<<< HEAD:src/enrichers/identifiers-nohash.ts
function _parseIdentifiersToResolve (state: State, storageHandler: IMinimalStorageHandler): State {
=======
/**
 * @param {State} state
 * @param {StorageHandler} storageHandler
 * @returns {string[]}
 * @private
 */
function _parseIdentifiersToResolve (state, storageHandler) {
>>>>>>> master:src/enrichers/identifiers-nohash.js
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
