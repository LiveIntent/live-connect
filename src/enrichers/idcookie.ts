import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'
import { Enricher, IdCookieConfig } from '../types'

type Input = { idCookie?: IdCookieConfig, peopleVerifiedId?: string }
type Output = { resolvedIdCookie?: string }

export function enrichIdCookie(
  storageHandler: WrappedReadOnlyStorageHandler
): Enricher<Input, Output> {
  return state => {
    if (state.idCookie?.mode === 'provided' && state.idCookie?.strategy === 'cookie' && typeof state.idCookie?.name === 'string') {
      return { ...state, resolvedIdCookie: storageHandler.getCookie(state.idCookie.name) || undefined }
    } else if (state.idCookie?.mode === 'provided' && state.idCookie?.strategy === 'localStorage' && typeof state.idCookie?.name === 'string') {
      return { ...state, resolvedIdCookie: storageHandler.getDataFromLocalStorage(state.idCookie.name) || undefined }
    } else {
      return state
    }
  }
}
