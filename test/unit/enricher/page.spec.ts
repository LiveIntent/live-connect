import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import * as pageEnricher from '../../../src/enrichers/page'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('PageEnricher', () => {
  const url = 'https://www.example.com/?sad=0&dsad=iou'
  const referrer = 'https://first.example.com/?key=value'
  beforeEach(() => jsdom('', {
    url,
    referrer,
    resources: 'usable',
    runScripts: 'dangerously'
  }))

  it('should return the url, referrer and the contextElements of the page', () => {
    const newHeadline = document.createElement('h1')
    const content = document.createTextNode('Some header')
    newHeadline.appendChild(content)
    const newP = document.createElement('p')
    const newContentEmail = document.createTextNode('mailto:john@test.com, also found: another@test.com !')
    newP.appendChild(newContentEmail)
    document.body.appendChild(newHeadline)
    document.body.appendChild(newP)

    const state = {
      contextSelectors: 'h1,p',
      contextElementsLength: 1000
    }
    const encodedContextElements = 'PGgxPlNvbWUgaGVhZGVyPC9oMT48cD5tYWlsdG86NTYzNGZmMTNmOTUzZWJjYjM3NGFjOGMzNDliY2ZjZmUsIGFsc28gZm91bmQ6IGYxMzdlM2QwOTg5ODc3ZWIzZjU3NWRjOWNkNmRmZDBkICE8L3A-'
    const result = pageEnricher.enrich(state)
    expect(result).to.eql({
      pageUrl: url,
      referrer,
      contextElements: encodedContextElements
    })
  })
})
