import { expect, use } from 'chai'
import dirtyChai from 'dirty-chai'
import { UrlCollectionModes } from '../../../src/model/url-collection-mode'
import { collectUrl, blockedQueryParams, isPageRemoved } from '../../../src/pixel/url-collector'

use(dirtyChai)

describe('URLCollector', () => {
  it('should not modify input url if no config is provided', function () {
    const config = {}
    const url = 'https://www.example.com/page/path?query=v1&id=v2'
    const expectedUrl = url
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql([])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should not modify input url if default config values are provided', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.fullUrl
    }
    const url = 'https://www.example.com/page/path?query=v1&id=v2'
    const expectedUrl = url
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql([])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should not modify input url if an empty filter is provided', function () {
    const config = {
      queryParametersFilter: ''
    }
    const url = 'https://www.example.com/page/path?query=v1&id=v2'
    const expectedUrl = url
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql([])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should remove the page part of the url if the collection mode is no_page', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.noPageUrl
    }
    const url = 'https://www.example.com/page/path?query=v1&id=v2'
    const expectedUrl = 'https://www.example.com/?query=v1&id=v2'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql([])
    expect(isPageRemoved(url, config)).to.eql(true)
  })

  it('should remove from the url the query parameters with a name that match the filter', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.fullUrl,
      queryParametersFilter: '^foo$'
    }
    const url = 'https://www.example.com/page?query=v1&foo=bar&id=v2'
    const expectedUrl = 'https://www.example.com/page?query=v1&id=v2'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['foo'])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should remove from the url multiple query parameters with that match the filter', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.fullUrl,
      queryParametersFilter: '^(foo|bar)$'
    }
    const url = 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4'
    const expectedUrl = 'https://www.example.com/page?query=v1&id=v4'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['foo', 'bar'])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should be able to use filter to allow query parameters with a given prefix', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.fullUrl,
      queryParametersFilter: '^((?!prefix).*)$'
    }
    const url = 'https://www.example.com/page?query=v1&prefix=v2&id=v3&prefix_too=v4'
    const expectedUrl = 'https://www.example.com/page?prefix=v2&prefix_too=v4'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['query', 'id'])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should be able to use filter as an allow list using negative lookahead', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.fullUrl,
      queryParametersFilter: '^(?!foo$|bar$).*'
    }
    const url = 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4'
    const expectedUrl = 'https://www.example.com/page?foo=v2&bar=v3'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['query', 'id'])
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should be able to handle complex scenarios, like blocking any param not named allowed or not ending end with th', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.noPageUrl,
      queryParametersFilter: '^(?!allowed$|.*th$).*'
    }
    const url = 'https://www.example.com/page?first=v1&foo=v2&myth=v3&second=v4&allowed=v5&third=v6&id=v7&fourth=v8&other=v9&fifth=v10&allowed2=v11&last=v12'
    const expectedUrl = 'https://www.example.com/?myth=v3&allowed=v5&fourth=v8&fifth=v10'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['first', 'foo', 'second', 'third', 'id', 'other', 'allowed2', 'last'])
    expect(isPageRemoved(url, config)).to.eql(true)
  })

  it('should return the domain only if the collection mode is no_page and all params are blocked', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.noPageUrl,
      queryParametersFilter: '^(foo|bar)$'
    }
    const url = 'www.example.com/page?foo=v1&bar=v2'
    const expectedUrl = 'www.example.com/'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql(['foo', 'bar'])
    expect(isPageRemoved(url, config)).to.eql(true)
  })

  it('should return false for isPageRemoved when the collection mode is no_page, but there is no page to remove', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.noPageUrl
    }
    const url = 'https://www.example.com/?query=v1&id=v2'
    expect(isPageRemoved(url, config)).to.eql(false)
  })

  it('should return an empty array for blockedQueryParams when there are no query parameters', function () {
    const config = {
      urlCollectionMode: UrlCollectionModes.noPageUrl,
      queryParametersFilter: '^(foo|bar)$'
    }
    const url = 'https://www.example.com/very/long/page'
    const expectedUrl = 'https://www.example.com/'
    expect(collectUrl(url, config)).to.eql(expectedUrl)
    expect(blockedQueryParams(url, config)).to.eql([])
    expect(isPageRemoved(url, config)).to.eql(true)
  })
})
