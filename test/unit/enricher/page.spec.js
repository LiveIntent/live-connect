import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import * as pageEnricher from '../../../src/enrichers/page'

describe('PageEnricher', () => {
  const url = 'http://www.example.com/?sad=0&dsad=iou'
  const referrer = 'https://first.example.com?key=value'
  jsdom({
    url: url,
    referrer: referrer,
    resources: 'usable',
    runScripts: 'dangerously',
    useEach: true
  })

  it('should return the url and the referrer of the page"', function () {
    const state = {}
    const result = pageEnricher.enrich(state)
    expect(result).to.eql({
      pageUrl: url,
      referrer: referrer
    })
  })
})
