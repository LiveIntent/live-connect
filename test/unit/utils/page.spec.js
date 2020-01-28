import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import { parentHostname } from '../../../src/utils/page'

describe('Page Utils', () => {

  jsdom({
    url: 'https://liveinte.com',
    referrer: 'https://first.example.com?key=value'
  })

  it('should get hostname of a referrer', function () {
    const hostName = parentHostname()

    expect(hostName).to.eql('first.example.com')
  })

})
