import { expect } from 'chai'
import * as storage from '../../../src/utils/storage'
import jsdom from 'mocha-jsdom'

describe('Storage', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })
  it('should add a cookie, return it after', function () {
    storage.setCookie('x', 'new-value', 2, undefined, 'example.com')
    const reCheck = storage.getCookie('x', )
    expect(reCheck).to.eql('new-value')
  })

  it('should return false if LS is inaccessible', function () {
    window.localStorage.getItem = () => JSON.parse('7')
    const storedValue = storage.getDataFromLocalStorage('x')
    expect(storedValue).to.eql(null)
  })

  it('should create an LS entry, return it after', function () {
    storage.setDataInLocalStorage('x', 'new-value')
    const reCheck = storage.getDataFromLocalStorage('x')
    expect('new-value').to.eql(reCheck)
    expect(window.localStorage.getItem('x')).to.eql(reCheck)
  })

  it('should return lookalikes from the cookie jar', function () {
    storage.setCookie('_crap_.id.sss', 'some-value')
    storage.setCookie('_crap_.sess.aaa', 'another-value')
    const cookieEntries = storage.findSimilarCookies('_crap_.')
    expect(cookieEntries).to.eql(['another-value', 'some-value'])
  })
})
