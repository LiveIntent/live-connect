import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import * as pageEnricher from '../../../src/enrichers/page'

describe('PageEnricher', () => {
  const url = 'http://www.example.com/?sad=0&dsad=iou'
  jsdom({
    url: url,
    resources: 'usable',
    runScripts: 'dangerously',
    useEach: true
  })

  it('should return the url of the page"', function () {
    const state = {}
    const result = pageEnricher.enrich(state)
    expect(result.pageUrl).to.eql(url)
  })
})
