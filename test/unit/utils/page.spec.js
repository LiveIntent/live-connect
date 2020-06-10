import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import { getPage, isIframe, loadedDomain } from '../../../src/utils/page';

describe('Page Utils', () => {
  jsdom({
    url: 'https://liveintent.com',
    referrer: 'https://first.example.com?key=value',
    useEach: true
  })

  it('isIframe should return true if exception is thrown', function () {
    Object.defineProperty(window, 'self', {
      get: () => { throw Error('FailedOnPurpose') }
    })
    expect(isIframe()).to.be.true
  })

  it('getPage should return the actual url', function () {
    expect(getPage()).to.be.eql('https://liveintent.com/')
  })

  it('getPage should return the parent url if within an iframe', function () {
    Object.defineProperty(window, 'self', {
      get: () => { throw Error('FailedOnPurpose') }
    })
    expect(getPage()).to.be.eql('https://first.example.com?key=value')
  })

  it('loaded domain should return the host', function () {
    expect(loadedDomain()).to.be.eql('liveintent.com')
    document.domain = null
    expect(loadedDomain()).to.be.eql('liveintent.com')
    document.location = null
    expect(loadedDomain()).to.be.eql('liveintent.com')
  })

})
