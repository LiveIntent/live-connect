import { WrappedStorageHandler } from '../handlers/storage-handler.js'
import { loadedDomain } from './page.js'

const TLD_CACHE_KEY = '_li_dcdm_c'

export function determineHighestWritableDomain(storageHandler: WrappedStorageHandler): string {
  const cachedDomain = storageHandler.getCookie(TLD_CACHE_KEY)
  if (cachedDomain) {
    return cachedDomain
  }
  const domain = loadedDomain()
  const arr = domain.split('.')
  for (let i = arr.length; i > 0; i--) {
    const newD = `.${arr.slice(i - 1, arr.length).join('.')}`
    storageHandler.setCookie(TLD_CACHE_KEY, newD, undefined, 'Lax', newD)
    if (storageHandler.getCookie(TLD_CACHE_KEY)) {
      return newD
    }
  }
  return `.${domain}`
}
