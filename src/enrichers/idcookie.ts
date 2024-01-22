import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'
import { Enricher, State } from '../types'

type Input = Pick<State, 'idCookie' | 'peopleVerifiedId'>
type Output = Pick<State, 'resolvedIdCookie'>

export function enrichIdCookie(
  storageHandler: WrappedReadOnlyStorageHandler
): Enricher<Input, Output> {
  return state => {
    if (state.idCookie?.strategy === 'cookie' && typeof state.idCookie?.name === 'string') {
      return { ...state, resolvedIdCookie: storageHandler.getCookie(state.idCookie.name) }
    } else if (state.idCookie?.strategy === 'localStorage' && typeof state.idCookie?.name === 'string') {
      return { ...state, resolvedIdCookie: storageHandler.getDataFromLocalStorage(state.idCookie.name) }
    } else {
      return state
    }
  }
}
