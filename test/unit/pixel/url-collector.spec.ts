import { expect, use } from 'chai'
import dirtyChai from 'dirty-chai'
import { UrlCollectionModes } from '../../../src/model/url-collection-mode'
import { collectUrl } from '../../../src/pixel/url-collector'

use(dirtyChai)

describe('URLCollector', () => {
  it('should not modify input url if no config is provided', function () {
    const state = {
      pageUrl: 'https://www.example.com/page/path?query=v1&id=v2'
    }
    const expectedUrl = state.pageUrl
    expect(collectUrl(state)).to.eql([expectedUrl, false, []])
  })

  it('should not modify input url if default config values are provided', function () {
    const state = {
      pageUrl: 'https://www.example.com/page/path?query=v1&id=v2',
      urlCollectionMode: UrlCollectionModes.full
    }
    const expectedUrl = state.pageUrl
    expect(collectUrl(state)).to.eql([expectedUrl, false, []])
  })

  it('should not modify input url if an empty filter is provided', function () {
    const state = {
      pageUrl: 'https://www.example.com/page/path?query=v1&id=v2',
      queryParametersFilter: ''
    }
    const expectedUrl = state.pageUrl
    expect(collectUrl(state)).to.eql([expectedUrl, false, []])
  })

  it('should remove the page part of the url if the collection mode is no_page', function () {
    const state = {
      pageUrl: 'https://www.example.com/page/path?query=v1&id=v2',
      urlCollectionMode: UrlCollectionModes.noPage
    }
    const expectedUrl = 'https://www.example.com/?query=v1&id=v2'
    expect(collectUrl(state)).to.eql([expectedUrl, true, []])
  })

  it('should remove from the url the query parameters with a name that match the filter', function () {
    const state = {
      pageUrl: 'https://www.example.com/page?query=v1&foo=bar&id=v2',
      urlCollectionMode: UrlCollectionModes.full,
      queryParametersFilter: '^foo$'
    }
    const expectedUrl = 'https://www.example.com/page?query=v1&id=v2'
    expect(collectUrl(state)).to.eql([expectedUrl, false, ['foo']])
  })

  it('should remove from the url multiple query parameters with a name that match the filter', function () {
    const state = {
      pageUrl: 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4',
      urlCollectionMode: UrlCollectionModes.full,
      queryParametersFilter: '^(foo|bar)$'
    }
    const expectedUrl = 'https://www.example.com/page?query=v1&id=v4'
    expect(collectUrl(state)).to.eql([expectedUrl, false, ['foo', 'bar']])
  })

  it('should be able to use filter to allow only query parameters with a given prefix', function () {
    const state = {
      pageUrl: 'https://www.example.com/page?query=v1&prefix=v2&id=v3&prefix_too=v4',
      urlCollectionMode: UrlCollectionModes.full,
      queryParametersFilter: '^((?!prefix).*)$'
    }
    const expectedUrl = 'https://www.example.com/page?prefix=v2&prefix_too=v4'
    expect(collectUrl(state)).to.eql([expectedUrl, false, ['query', 'id']])
  })

  it('should be able to use filter as an allow list using negative lookahead', function () {
    const state = {
      pageUrl: 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4',
      urlCollectionMode: UrlCollectionModes.full,
      queryParametersFilter: '^(?!foo$|bar$).*'
    }
    const expectedUrl = 'https://www.example.com/page?foo=v2&bar=v3'
    expect(collectUrl(state)).to.eql([expectedUrl, false, ['query', 'id']])
  })

  it('should be able to handle complex scenarios, like blocking any param not named allowed or not ending end with th', function () {
    const state = {
      pageUrl: 'https://www.example.com/page?first=v1&foo=v2&myth=v3&second=v4&allowed=v5&third=v6&id=v7&fourth=v8&other=v9&fifth=v10&allowed2=v11&last=v12',
      urlCollectionMode: UrlCollectionModes.noPage,
      queryParametersFilter: '^(?!allowed$|.*th$).*'
    }
    const expectedUrl = 'https://www.example.com/?myth=v3&allowed=v5&fourth=v8&fifth=v10'
    const expectedBlockedParams = ['first', 'foo', 'second', 'third', 'id', 'other', 'allowed2', 'last']
    expect(collectUrl(state)).to.eql([expectedUrl, true, expectedBlockedParams])
  })

  it('should return the domain only if the collection mode is no_page and all params are blocked', function () {
    const state = {
      pageUrl: 'www.example.com/page?foo=v1&bar=v2',
      urlCollectionMode: UrlCollectionModes.noPage,
      queryParametersFilter: '^(foo|bar)$'
    }
    const expectedUrl = 'www.example.com/'
    expect(collectUrl(state)).to.eql([expectedUrl, true, ['foo', 'bar']])
  })

  it('should return false for isPageRemoved when the collection mode is no_page, but there is no page to remove', function () {
    const state = {
      pageUrl: 'https://www.example.com/?query=v1&id=v2',
      urlCollectionMode: UrlCollectionModes.noPage
    }
    const expectedUrl = state.pageUrl
    expect(collectUrl(state)).to.eql([expectedUrl, false, []])
  })

  it('should return an empty array for blockedQueryParams when there are no query parameters', function () {
    const state = {
      pageUrl: 'https://www.example.com/very/long/page',
      urlCollectionMode: UrlCollectionModes.noPage,
      queryParametersFilter: '^(foo|bar)$'
    }
    const expectedUrl = 'https://www.example.com/'
    expect(collectUrl(state)).to.eql([expectedUrl, true, []])
  })
})
