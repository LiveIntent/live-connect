import { expect } from 'chai'
import * as storage from '../../../src/utils/storage'
import jsdom from 'mocha-jsdom'
import { StorageStrategy } from '../../../src/model/storage-strategy'

describe('Storage', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })
  it('should create a cookie if it doesn\'t exist, return it after', function () {
    const newCookie = storage.getOrAddWithExpiration('x', 'new-value', {}, StorageStrategy.cookie)
    expect(newCookie).to.eql('new-value')
    const reCheck = storage.getOrAddWithExpiration('x', 'new-new-value')
    expect(newCookie).to.eql(reCheck)
  })

  it('should return false if LS is inaccessible', function () {
    window.localStorage.getItem = () => JSON.parse('7')
    const storedValue = storage.getFromLs('x')
    expect(storedValue).to.eql(null)
  })

  it('should create an LS entry if it doesn\'t exist, return it after', function () {
    const lsEntry = storage.getOrAddWithExpiration('x', 'new-value', { expires: 10 }, StorageStrategy.localStorage)
    expect(lsEntry).to.eql('new-value')
    const reCheck = storage.getOrAddWithExpiration('x', 'new-new-value', { expires: 10 }, StorageStrategy.localStorage)
    expect(lsEntry).to.eql(reCheck)
    expect(window.localStorage.getItem('x')).to.eql(reCheck)
  })

  it('should delete a LS entry if _exp is older than expiry and create a new value', function () {
    storage.addToLs('x', 'old_value')
    storage.addToLs('x_exp', '-1')
    const lsEntry = storage.getOrAddWithExpiration('x', 'new-value', { expires: 10 }, StorageStrategy.localStorage)
    expect(lsEntry).to.eql('new-value')

    expect(window.localStorage.getItem('x')).to.eql(lsEntry)
  })

  it('should not create any LS or cookie jar entries if storage strategy is "none"', function () {
    const entry = storage.getOrAddWithExpiration('x', 'new-value', { expires: 10 }, StorageStrategy.none)
    expect(entry).to.eql(null)
    expect(storage.getCookie('x')).to.eql(null)
    expect(storage.getFromLs('x')).to.eql(null)
  })

  it('should return lookalikes from the cookie jar', function () {
    storage.setCookie('_crap_.id.sss', 'some-value')
    storage.setCookie('_crap_.sess.aaa', 'another-value')
    const cookieEntries = storage.findSimilarInJar('_crap_.')
    expect(cookieEntries).to.eql(['another-value', 'some-value'])
  })
})
