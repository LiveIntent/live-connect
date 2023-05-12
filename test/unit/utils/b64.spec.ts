import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import { base64UrlEncode } from '../../../src/utils/b64'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('B64 Utils', () => {
  beforeEach(() => jsdom('', {
    url: 'https://liveinte.com',
    referrer: 'https://first.example.com?key=value'
  }))

  it('should work for esoteric strings using native btoa', () => {
    const hostName = base64UrlEncode('☸☹☺☻☼☾☿')
    expect(hostName).to.eql('4pi44pi54pi64pi74pi84pi-4pi_')
  })

  it('should work for esoteric strings using lib btoa', () => {
    // @ts-expect-error
    window.btoa = undefined
    const hostName = base64UrlEncode('☸☹☺☻☼☾☿')
    expect(hostName).to.eql('4pi44pi54pi64pi74pi84pi-4pi_')
  })
})
