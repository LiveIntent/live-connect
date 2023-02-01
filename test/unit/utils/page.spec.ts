import jsdom from 'mocha-jsdom'
import { expect, use } from 'chai'
import { getPage, getReferrer, getContextElements, loadedDomain } from '../../../src/utils/page'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('Page Utils', () => {
  jsdom({
    url: 'https://liveintent.com/about?key=value',
    referrer: 'https://first.example.com?key=value',
    useEach: true
  })

  it('loaded domain should return the host', function () {
    expect(loadedDomain()).to.be.eql('liveintent.com')
    document.domain = null
    expect(loadedDomain()).to.be.eql('liveintent.com')
    document.location = null
    expect(loadedDomain()).to.be.eql('liveintent.com')
  })

  it('getPage should return the url for the top-level window', function () {
    expect(getPage()).to.be.eql('https://liveintent.com/about?key=value')
  })

  it('getPage should return the url for the iframe', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)

    expect(getPage(iframe.contentWindow)).to.be.eql('https://liveintent.com/about?key=value')
  })

  it('getPage should return the url for the nested iframe', function () {
    const iframe1 = document.createElement('iframe')
    document.documentElement.appendChild(iframe1)
    const iframe2 = iframe1.contentDocument.createElement('iframe')
    iframe1.contentDocument.documentElement.appendChild(iframe2)
    iframe2.src = 'https://double.nested.com/about?key=value'

    expect(getPage(iframe2.contentWindow)).to.be.eql('https://liveintent.com/about?key=value')
  })

  it('getPage should return the url when the window location is not defined', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)
    definedProperty(window, 'location', () => { return undefined })

    expect(getPage(iframe.contentWindow)).to.be.eql('https://liveintent.com/about?key=value')
  })

  it('getPage should return the iframe url when the window url and the iframe referrer are not defined', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)
    definedProperty(window, 'location', () => { return undefined })
    definedProperty(iframe.contentWindow, 'document', () => { return undefined })

    expect(getPage(iframe.contentWindow)).to.be.eql('https://nested.liveintent.com/about?key=value')
  })

  it('getPage should return the origin when only ancestor origins are defined', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)
    definedProperty(window, 'location', () => { return undefined })
    definedProperty(iframe.contentWindow, 'document', () => { return undefined })
    definedProperty(iframe.contentWindow, 'location', () => {
      return {
        href: undefined,
        ancestorOrigins: { 0: 'https://liveintent.com/' }
      }
    })

    expect(getPage(iframe.contentWindow)).to.be.eql('https://liveintent.com/')
  })

  it('getPage should not return the url when it is not defined', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)
    definedProperty(window, 'location', () => { return undefined })
    definedProperty(iframe.contentWindow, 'document', () => { return undefined })
    definedProperty(iframe.contentWindow, 'location', () => { return undefined })

    expect(getPage(iframe.contentWindow)).to.be.undefined()
  })

  it('getReferrer should return the referrer for the top-level window', function () {
    expect(getReferrer()).to.be.eql('https://first.example.com?key=value')
  })

  it('getReferrer should not return the referrer when the top is not defined', function () {
    definedProperty(window, 'top', () => { return undefined })

    expect(getReferrer()).to.be.undefined()
  })

  it('getReferrer should return the referrer for the iframe', function () {
    const iframe = document.createElement('iframe')
    iframe.src = 'https://nested.liveintent.com/about?key=value'
    document.documentElement.appendChild(iframe)

    expect(getReferrer(iframe.contentWindow)).to.be.eql('https://first.example.com?key=value')
  })

  it('getReferrer should return the referrer for the nested iframe', function () {
    const iframe1 = document.createElement('iframe')
    document.documentElement.appendChild(iframe1)
    const iframe2 = iframe1.contentDocument.createElement('iframe')
    iframe1.contentDocument.documentElement.appendChild(iframe2)
    iframe2.src = 'https://double.nested.com/about?key=value'

    expect(getReferrer(iframe2.contentWindow)).to.be.eql('https://first.example.com?key=value')
  })

  it('getContextElements should properly encode when emails are hashed', function () {
    createElement('h1', 'mailto:john@test.com, also found: another@test.com !', document)
    const result = getContextElements(false, 'h1', 1000).length
    expect(result).to.be.eql(128)
  })

  it('getContextElements should return empty when contextSelectors or contextElementsLength is invalid', function () {
    createElement('p', 'mailto:john@test.com, also found: another@test.com !', document)
    expect(getContextElements(false, '', 1000)).to.be.eql('')
  })

  it('getContextElements should stop encoding when the next element overflows the contextElementsLength', function () {
    createElement('h1', 'First element', document)
    createElement('h1', 'Second element', document)
    const result1 = getContextElements(false, 'h1', 31).length
    const result2 = getContextElements(false, 'h1', 32).length
    expect(result1).to.be.eql(0)
    expect(result2).to.be.eql(30)
  })

  it('getContextElements should properly encode the context elements found', function () {
    createElement('p', 'Some dummy text', document)
    const result = getContextElements(false, 'p', 1000)
    expect(result).to.be.eql('PHA-U29tZSBkdW1teSB0ZXh0PC9wPg')
  })

  it('getContextElements should return empty string when privacyMode is true', function () {
    createElement('p', 'Some dummy text', document)
    const result = getContextElements(true, 'p', 1000).length
    expect(result).to.be.eql(0)
  })
})

function createElement(tag, text, document) {
  const newElement = document.createElement(tag)
  const newContent = document.createTextNode(text)
  newElement.appendChild(newContent)
  document.documentElement.appendChild(newElement)
}

function definedProperty(object, name, getter) {
  Object.defineProperty(object, name, {
    get: getter
  })
}
