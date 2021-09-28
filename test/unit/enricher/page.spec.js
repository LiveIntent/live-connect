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

  it('should return the url, referrer and the contextElements of the page"', function () {
    var newHeadline = document.createElement("h1")
    var newContent = document.createTextNode("test")
    newHeadline.appendChild(newContent)
    document.body.appendChild(newHeadline)

    const state = {
      contextSelectors: 'h1',
      contextElementsLength: 1000
    }
    const encodedContextElements = 'dGVzdA'
    const result = pageEnricher.enrich(state)
    expect(result).to.eql({
      pageUrl: url,
      referrer: referrer,
      contextElements: encodedContextElements
    })
  })
})
