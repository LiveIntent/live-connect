import { UrlCollectionModes } from '../model/url-collection-mode'
import { LiveConnectConfig } from '../types'
import { ParsedUrl, urlParamsArray } from '../utils/url'

export function collectUrl(urlString: string, conf: LiveConnectConfig): string {
  const url = new ParsedUrl(urlString)
  if (conf.urlCollectionMode === UrlCollectionModes.noPageUrl) {
    url.pathname = '/'
  }
  url.search = paramsToKeep(url, conf)
  return url.toString()
}

export function blockedQueryParams(urlString: string | undefined, conf: LiveConnectConfig): string[] {
  if (!urlString) {
    return []
  }
  const url = new ParsedUrl(urlString)
  return paramsToDelete(url, conf)
}

export function isPageRemoved(urlString: string | undefined, conf: LiveConnectConfig): boolean {
  if (!urlString || conf.urlCollectionMode !== UrlCollectionModes.noPageUrl) {
    return false
  }
  const url = new ParsedUrl(urlString)
  return url.pathname.length > 1
}

function paramsToDelete(url: ParsedUrl, conf: LiveConnectConfig): string[] {
  if (conf.queryParametersFilter === undefined || conf.queryParametersFilter === '') {
    return []
  }
  const urlQueryParameters = urlParamsArray(url.search)
  const filterRegExp = new RegExp(conf.queryParametersFilter)
  return urlQueryParameters.map(keyValuePair => keyValuePair[0]).filter(param => filterRegExp.test(param))
}

function paramsToKeep(url: ParsedUrl, conf: LiveConnectConfig): string {
  if (conf.queryParametersFilter === undefined || conf.queryParametersFilter === '') {
    return url.search
  }
  const urlQueryParameters = urlParamsArray(url.search)
  const filterRegExp = new RegExp(conf.queryParametersFilter)
  const params = urlQueryParameters.filter(param => !filterRegExp.test(param[0])).map(keyValue => `${keyValue[0]}=${keyValue[1]}`)
  if (params.length > 0) {
    return `?${params.join('&')}`
  } else {
    return ''
  }
}
