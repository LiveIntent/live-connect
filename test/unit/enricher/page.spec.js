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

  it('should return the url, referrer and the contextElements of the page', function () {
    var newHeadline = document.createElement("h1")
    var content = document.createTextNode("Some header")
    newHeadline.appendChild(content)
    var newP = document.createElement("p")
    var newContentEmail = document.createTextNode("mailTo: john@test.com, also found: another@test.com !")
    newP.appendChild(newContentEmail)
    document.body.appendChild(newHeadline)
    document.body.appendChild(newP)

    const state = {
      contextSelectors: 'h1,p',
      contextElementsLength: 1000
    }
    const encodedContextElements = 'PGgxPlNvbWUgaGVhZGVyPC9oMT4sPHA-bWFpbFRvOiA1NjM0ZmYxM2Y5NTNlYmNiMzc0YWM4YzM0OWJjZmNmZSwgYWxzbyBmb3VuZDogZjEzN2UzZDA5ODk4NzdlYjNmNTc1ZGM5Y2Q2ZGZkMGQgITwvcD4'
    const result = pageEnricher.enrich(state)
    expect(result).to.eql({
      pageUrl: url,
      referrer: referrer,
      contextElements: encodedContextElements
    })
  })
})
