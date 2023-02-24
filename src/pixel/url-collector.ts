import { UrlCollectionModes } from '../model/url-collection-mode'
import { LiveConnectConfig, State } from '../types'
import { ParsedParam, ParsedUrl, urlParamsArray } from '../utils/url'

type UrlParam = ParsedParam | ParsedParam[]

export function collectUrl(state: State): [string, boolean, string[]] {
  if (state.pageUrl === undefined || state.pageUrl.length === 0) {
    return ['', false, []]
  }
  if (isDefaultBehavior(state)) {
    return [state.pageUrl, false, []]
  }
  const url = new ParsedUrl(state.pageUrl)
  const urlQueryParameters = urlParamsArray(url.search)
  const pageRemoved = isPageRemoved(url, state)
  const blockedParams = paramsToDelete(urlQueryParameters, state)
  if (pageRemoved) {
    url.pathname = '/'
  }
  if (blockedParams.length > 0) {
    url.search = queryStringToKeep(urlQueryParameters, blockedParams)
  }
  return [url.toString(), pageRemoved, blockedParams]
}

function isPageRemoved(url: ParsedUrl, conf: LiveConnectConfig): boolean {
  return conf.urlCollectionMode === UrlCollectionModes.noPage && url.pathname.length > 1
}

function paramsToDelete(urlQueryParameters: [string, UrlParam][], conf: LiveConnectConfig): string[] {
  if (conf.queryParametersFilter === undefined || conf.queryParametersFilter === '') {
    return []
  }
  const filterRegExp = new RegExp(conf.queryParametersFilter)
  return urlQueryParameters.map(keyValuePair => keyValuePair[0]).filter(param => filterRegExp.test(param))
}

function queryStringToKeep(urlQueryParameters: [string, UrlParam][], paramsToDelete: string[]): string {
  const params = urlQueryParameters
    .filter(param => !paramsToDelete.includes(param[0]))
    .map(keyValue => `${keyValue[0]}=${keyValue[1]}`)
  if (params.length > 0) {
    return `?${params.join('&')}`
  } else {
    return ''
  }
}

function isDefaultBehavior(state: State): boolean {
  return (state.urlCollectionMode === undefined || state.urlCollectionMode === UrlCollectionModes.full) &&
    (state.queryParametersFilter === undefined || state.queryParametersFilter === '')
}
