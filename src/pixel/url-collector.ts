import { UrlCollectionMode, UrlCollectionModes } from '../model/url-collection-mode.js'
import { LiveConnectConfig } from '../types.js'
import { ParsedParam, ParsedUrl, urlParamsArray } from '../utils/url.js'

type UrlParam = ParsedParam | ParsedParam[]
type UrlState = {
  pageUrl?: string
  urlCollectionMode?: UrlCollectionMode
  queryParametersFilter?: string
}

export function collectUrl(state: UrlState): [string, boolean, string[]] {
  if (state.pageUrl === undefined || state.pageUrl.length === 0) {
    return ['', false, []]
  }
  if (isDefaultBehavior(state)) {
    return [state.pageUrl, false, []]
  }
  const url = new ParsedUrl(state.pageUrl)
  const urlQueryParameters = urlParamsArray(url.search)
  const pathRemoved = isPathRemoved(url, state)
  const blockedParams = paramsToDelete(urlQueryParameters, state)
  if (pathRemoved) {
    url.pathname = '/'
  }
  if (blockedParams.length > 0) {
    url.search = queryStringToKeep(urlQueryParameters, blockedParams)
  }
  return [url.toString(), pathRemoved, blockedParams]
}

export function stripQueryAndPath(pageUrl: string): string | undefined {
  if (pageUrl.length === 0) {
    return undefined
  } else {
    const url = new ParsedUrl(pageUrl)
    url.pathname = ''
    url.search = ''
    return url.toString()
  }
}

function isPathRemoved(url: ParsedUrl, conf: LiveConnectConfig): boolean {
  return conf.urlCollectionMode === UrlCollectionModes.noPath && url.pathname.length > 1
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
    .filter(param => paramsToDelete.indexOf(param[0]) === -1)
    .map(keyValue => `${keyValue[0]}=${keyValue[1]}`)
  if (params.length > 0) {
    return `?${params.join('&')}`
  } else {
    return ''
  }
}

function isDefaultBehavior(state: UrlState): boolean {
  return (state.urlCollectionMode === undefined || state.urlCollectionMode === UrlCollectionModes.full) &&
    (state.queryParametersFilter === undefined || state.queryParametersFilter === '')
}
