import { WrappedReadOnlyStorageHandler } from '../handlers/storage-handler'
import { Enricher, IdCookieConfig } from '../types'

type Input = { idCookie?: IdCookieConfig, peopleVerifiedId?: string }
type Output = { resolvedIdCookie: string | null }

export function enrichIdCookie(
  storageHandler: WrappedReadOnlyStorageHandler
): Enricher<Input, Output> {
  return state => {
    let resolvedIdCookie: string | null

    if (state.idCookie?.mode === 'provided' && state.idCookie?.strategy === 'cookie' && typeof state.idCookie?.name === 'string') {
      resolvedIdCookie = storageHandler.getCookie(state.idCookie.name)
    } else if (state.idCookie?.mode === 'provided' && state.idCookie?.strategy === 'localStorage' && typeof state.idCookie?.name === 'string') {
      resolvedIdCookie = storageHandler.getDataFromLocalStorage(state.idCookie.name)
    } else {
      resolvedIdCookie = state.peopleVerifiedId ?? null
    }

    return { ...state, resolvedIdCookie }
  }
}
