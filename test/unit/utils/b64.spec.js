import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import { base64UrlEncode } from '../../../src/utils/b64'

describe('B64 Utils', () => {

  jsdom({
    url: 'https://liveinte.com',
    referrer: 'https://first.example.com?key=value'
  })

  it('should work for esoteric strings using native btoa', function () {
    const hostName = base64UrlEncode('☸☹☺☻☼☾☿')
    expect(hostName).to.eql('4pi44pi54pi64pi74pi84pi-4pi_')
  })

  it('should work for esoteric strings using lib btoa', function () {
    window.btoa = undefined
    const hostName = base64UrlEncode('☸☹☺☻☼☾☿')
    expect(hostName).to.eql('4pi44pi54pi64pi74pi84pi-4pi_')
  })
})
