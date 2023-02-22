import { UrlCollectionModes } from '../model/url-collection-mode'
import { LiveConnectConfig } from '../types'

export function collectUrl(urlString: string, conf: LiveConnectConfig): string {
  const url = new URL(urlString)
  if (conf.urlCollectionMode === UrlCollectionModes.noPageUrl) {
    url.pathname = ''
  }
  paramsToDelete(url, conf).forEach(param => url.searchParams.delete(param))
  return url.toString()
}

export function blockedQueryParams(urlString: string | undefined, conf: LiveConnectConfig): string[] {
  if (!urlString) {
    return []
  }
  const url = new URL(urlString)
  return paramsToDelete(url, conf)
}

export function isPageRemoved(urlString: string | undefined, conf: LiveConnectConfig): boolean {
  if (!urlString || conf.urlCollectionMode !== UrlCollectionModes.noPageUrl) {
    return false
  }
  const url = new URL(urlString)
  return url.pathname.length > 1
}

function paramsToDelete(url: URL, conf: LiveConnectConfig): string[] {
  if (conf.queryParametersFilter === undefined || conf.queryParametersFilter === '') {
    return []
  }
  const urlQueryParameters = Array.from(url.searchParams)
  const filterRegExp = new RegExp(conf.queryParametersFilter)
  return urlQueryParameters.map(keyValuePair => keyValuePair[0]).filter(param => filterRegExp.test(param))
}
