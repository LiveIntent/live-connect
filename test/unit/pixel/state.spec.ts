import { expect, use } from 'chai'
import { hashEmail } from '../../../src/utils/hash.js'
import { enrichPrivacyMode } from '../../../src/enrichers/privacy-config.js'
import { StateWrapper } from '../../../src/pixel/state.js'
import { mergeObjects } from '../../../src/pixel/fiddler.js'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus.js'
import { UrlCollectionModes } from '../../../src/model/url-collection-mode.js'
import { State } from '../../../src/types.js'
import { ErrorDetails } from 'live-connect-common'

use(dirtyChai)

const COMMA = encodeURIComponent(',')
describe('EventComposition', () => {
  it('should construct an event out of anything', () => {
    const pixelData = { appId: '9898' }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.data).to.eql({ appId: '9898', eventSource: {} })
  })

  it('should construct valid params for valid members', () => {
    const pixelData = { appId: '9898' }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898&se=e30')
  })

  it('should ignore empty fields', () => {
    const pixelData = { appId: '9898', contextElements: '' }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898&se=e30')
  })

  it('should append c parameter last', () => {
    const pixelData: State = {
      contextElements: '<title>This title is a test</title>',
      appId: '9898',
      liveConnectId: '213245',
      trackerVersion: 'test tracker',
      pageUrl: 'https://wwww.example.com?sss',
      retrievedIdentifiers: [{
        name: 'sample_cookie',
        value: 'sample_value'
      }],
      hashesFromIdentifiers: [{
        md5: '75524519292e51ad6f761baa82d07d76',
        sha1: 'ec3685d99c376b4ee14a5b985a05fc23e21235cb',
        sha256: 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72'
      }],
      decisionIds: ['1', '2'],
      hashedEmail: ['eb2684ead8e942b6c4dc7465de66460a'],
      usPrivacyString: '1---',
      wrapperName: 'test wrapper name',
      gdprApplies: true,
      gdprConsent: 'test-gdpr-string',
      referrer: 'https://some.test.referrer.com',
      resolvedIdCookie: '123',
      gppString: 'test-gpp-string',
      gppApplicableSections: [1, 2, 3],
      cookieDomain: 'test-cookie-domain'
    }
    const event = StateWrapper.fromEvent(mergeObjects(pixelData, enrichPrivacyMode(pixelData)), { eventName: 'viewContent' })

    const expectedPairs = [
      'aid=9898', // appId
      'se=eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9', // base64 of eventSource
      'duid=213245', // liveConnectId
      'tv=test%20tracker', // trackerVersion
      'pu=https%3A%2F%2Fwwww.example.com%3Fsss', // pageUrl
      'ext_sample_cookie=sample_value', // retrievedIdentifiers
      'scre=75524519292e51ad6f761baa82d07d76%2Cec3685d99c376b4ee14a5b985a05fc23e21235cb%2Ce168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72', // comma-separated hashesFromIdentifiers
      'li_did=1%2C2', // decisionIds
      'e=eb2684ead8e942b6c4dc7465de66460a', // hashedEmail
      'us_privacy=1---', // usPrivacyString
      'wpn=test%20wrapper%20name', // wrapperName
      'gdpr=1', // gdprApplies
      'gdpr_consent=test-gdpr-string', // gdprConsent
      'refr=https%3A%2F%2Fsome.test.referrer.com', // referrer
      'gpp_s=test-gpp-string', // GPP string
      'gpp_as=1%2C2%2C3', // GPP applicable sections
      'cd=test-cookie-domain', // cookieDomain
      'ic=123', // resolvedIdCookie
      'c=%3Ctitle%3EThis%20title%20is%20a%20test%3C%2Ftitle%3E' // contextElements, low priority parameter
    ]
    expect(event.asQuery().toQueryString()).to.eql('?'.concat(expectedPairs.join('&')))
  })

  it('should set gdpr to 1 when the gdprApplies is defined but has a non boolean value', () => {
    const pixelData = {
      contextElements: '<title>This title is a test</title>',
      appId: '9898',
      liveConnectId: '213245',
      trackerVersion: 'test tracker',
      pageUrl: 'https://wwww.example.com?sss',
      errorDetails: { testError: 'testError' },
      retrievedIdentifiers: [{
        name: 'sample_cookie',
        value: 'sample_value'
      }],
      hashesFromIdentifiers: [{
        md5: '75524519292e51ad6f761baa82d07d76',
        sha1: 'ec3685d99c376b4ee14a5b985a05fc23e21235cb',
        sha256: 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72'
      }],
      decisionIds: ['1', '2'],
      hashedEmail: ['eb2684ead8e942b6c4dc7465de66460a'],
      usPrivacyString: '1---',
      wrapperName: 'test wrapper name',
      gdprApplies: 'a' as unknown as boolean,
      gdprConsent: 'test-consent-string',
      referrer: 'https://some.test.referrer.com'
    }
    const event = StateWrapper.fromEvent(mergeObjects(pixelData, enrichPrivacyMode(pixelData)), { eventName: 'viewContent' })

    const expectedPairs = [
      'aid=9898', // appId
      'se=eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9', // base64 of eventSource
      'duid=213245', // liveConnectId
      'tv=test%20tracker', // trackerVersion
      'pu=https%3A%2F%2Fwwww.example.com%3Fsss', // pageUrl
      'ae=eyJ0ZXN0RXJyb3IiOiJ0ZXN0RXJyb3IifQ', // base64 of errorDetails
      'ext_sample_cookie=sample_value', // retrievedIdentifiers
      'scre=75524519292e51ad6f761baa82d07d76%2Cec3685d99c376b4ee14a5b985a05fc23e21235cb%2Ce168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72', // comma-separated hashesFromIdentifiers
      'li_did=1%2C2', // decisionIds
      'e=eb2684ead8e942b6c4dc7465de66460a', // hashedEmail
      'us_privacy=1---', // usPrivacyString
      'wpn=test%20wrapper%20name', // wrapperName
      'gdpr=1', // gdprApplies
      'gdpr_consent=test-consent-string', // gdprConsent
      'refr=https%3A%2F%2Fsome.test.referrer.com', // referrer
      'c=%3Ctitle%3EThis%20title%20is%20a%20test%3C%2Ftitle%3E' // contextElements, low priority parameter
    ]
    expect(event.asQuery().toQueryString()).to.eql('?'.concat(expectedPairs.join('&')))
  })

  it('should ignore unknown fields', () => {
    const pixelData = {
      appId: '9898',
      randomField: 2135523
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898&se=e30')
  })

  it('should base64 the source', () => {
    const pixelData = {
      appId: '9898'
    }
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    const event = StateWrapper.fromEvent(pixelData, { eventName: 'viewContent' })
    expect(event.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}`)
  })

  it('should send gpp_s and gpp_as', () => {
    const pixelData = {
      gppString: 'test-gpp-string',
      gppApplicableSections: [1, 2, 3]
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    const expectedPairs = [
      'se=e30', // eventSource
      'gpp_s=test-gpp-string', // GPP string
      'gpp_as=1%2C2%2C3' // GPP applicable sections
    ]
    expect(event.asQuery().toQueryString()).to.eql('?'.concat(expectedPairs.join('&')))
  })

  it('should send us_privacy', () => {
    const pixelData = {
      usPrivacyString: '1---'
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql('?se=e30&us_privacy=1---')
  })

  it('should send gdpr as 1 & gdprConsent', () => {
    const pixelData = {
      gdprApplies: true,
      gdprConsent: 'some-string'
    }
    const event = StateWrapper.fromEvent(mergeObjects(pixelData, enrichPrivacyMode(pixelData)), { eventName: 'viewContent' })
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    expect(event.asQuery().toQueryString()).to.eql(`?se=${b64EncodedEventSource}&gdpr=1&gdpr_consent=some-string`)
  })

  it('should send gdpr 0 if gdprApplies is false', () => {
    const pixelData = {
      gdprApplies: false,
      gdprConsent: 'some-string'
    }
    const event = StateWrapper.fromEvent(mergeObjects(pixelData, enrichPrivacyMode(pixelData)), { eventName: 'viewContent' })
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    expect(event.asQuery().toQueryString()).to.eql(`?se=${b64EncodedEventSource}&gdpr=0&gdpr_consent=some-string`)
  })

  it('should send the tracker name', () => {
    const trackerVersion = 'some-name'
    const pixelData = { trackerVersion }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&tv=${trackerVersion}`)
  })

  it('should ignore nullable fields', () => {
    const event = StateWrapper.fromEvent({}, {})
    expect(event.asQuery().toQueryString()).to.eql('?se=e30')
  })

  it('should send the page url', () => {
    const pageUrl = 'https://wwww.example.com?sss'
    const pixelData = { pageUrl }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&pu=${encodeURIComponent(pageUrl)}`)
  })

  it('should send the removed parts of the page url', () => {
    const pageUrl = 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4'
    const pixelData = {
      pageUrl,
      urlCollectionMode: UrlCollectionModes.noPath,
      queryParametersFilter: '^(foo|bar)$'
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    const expectedUrl = 'https://www.example.com/?query=v1&id=v4'
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&pu=${encodeURIComponent(expectedUrl)}&pu_rp=1&pu_rqp=foo${COMMA}bar`)
  })

  it('should not send the removed parts of the page url when nothing was removed', () => {
    const pageUrl = 'https://www.example.com/?query=v1&id=v2'
    const pixelData = {
      pageUrl,
      urlCollectionMode: UrlCollectionModes.noPath,
      queryParametersFilter: '^(foo|bar)$'
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&pu=${encodeURIComponent(pageUrl)}`)
  })

  it('should send the application error', () => {
    const applicationError = { someKey: 'value' }
    const event = StateWrapper.fromError({}, applicationError as unknown as ErrorDetails)
    const b64EncodedEventSource = 'eyJzb21lS2V5IjoidmFsdWUifQ'
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&ae=${b64EncodedEventSource}`)
  })

  it('should update the data', () => {
    const pixelData = {
      appId: '9898'
    }
    const event = StateWrapper.fromEvent(pixelData, { eventName: 'viewContent' })

    event.setHashedEmail(['foo'])

    expect(event.data).to.eql({
      appId: '9898',
      eventSource: { eventName: 'viewContent' },
      hashedEmail: ['foo']
    })
  })

  it('should send the provided email hash', () => {
    const pixelData = {
      appId: '9898'
    }

    const event = {
      eventName: 'viewContent',
      email: '  e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72    '
    }

    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCIsImVtYWlsIjoiICBlMTY4ZTBlZGExMWY0ZmJiOGZiZDdjZmU1Zjc1MGNkMGY3ZTdmNGQ4NjQ5ZGE2OGUwNzNlOTI3NTA0ZWM1ZDcyICAgICJ9'
    const wrapped = StateWrapper.fromEvent(pixelData, event)
    expect(wrapped.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72`)
  })

  it('should never send emails as plain text, and hash the email that is set in the source', () => {
    const pixelData = {
      appId: '9898'
    }
    const event = {
      eventName: 'viewContent',
      email: '  xxx@yyy.com'
    }

    const hashes = hashEmail('xxx@yyy.com')
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCIsImVtYWlsIjoiKioqKioqKioqIn0'
    const wrapped = StateWrapper.fromEvent(pixelData, event)
    expect(wrapped.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=${hashes.md5}%2C${hashes.sha1}%2C${hashes.sha256}`)
  })

  it('should send the retrieved identifiers', () => {
    const cookie1 = {
      name: 'sample_cookie',
      value: 'sample_value'
    }
    const cookie2 = {
      name: 'sample_cookie2',
      value: 'sample_value2'
    }
    const pixelData = {
      retrievedIdentifiers: [cookie1, cookie2]
    }

    const event = StateWrapper.fromEvent(pixelData, {})

    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&ext_${cookie1.name}=${cookie1.value}&ext_${cookie2.name}=${cookie2.value}`)
  })

  it('should send the hashes found in retrieved identifiers', () => {
    const hashes1 = {
      md5: 'eb2684ead8e942b6c4dc7465de66460c',
      sha1: '51d8351892cf317ba9924e8548339039bd28bc73',
      sha256: 'eb274de5c9e88e9388f1a57529c8b13f9245be1d921269fc6aa69ef78b004a9d'
    }
    const hashes2 = {
      md5: '75524519292e51ad6f761baa82d07d76',
      sha1: 'ec3685d99c376b4ee14a5b985a05fc23e21235cb',
      sha256: 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72'
    }
    const pixelData = {
      hashesFromIdentifiers: [hashes1, hashes2]
    }

    const event = StateWrapper.fromEvent(pixelData, {})

    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&scre=${hashes1.md5}${COMMA}${hashes1.sha1}${COMMA}${hashes1.sha256}&scre=${hashes2.md5}${COMMA}${hashes2.sha1}${COMMA}${hashes2.sha256}`)
  })

  it('should send decisionIds ', () => {
    const pixelData = {
      decisionIds: ['1', '2']
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&li_did=1${COMMA}2`)
  })

  it('should not send decisionIds if array is empty', () => {
    const pixelData = {
      decisionIds: []
    }
    const event = StateWrapper.fromEvent(pixelData, {})
    expect(event.asQuery().toQueryString()).to.eql('?se=e30')
  })

  it('should not send an event if the event is just setting a HEM', () => {
    const event1 = {
      eventName: 'setEmail',
      email: '  xxx@yyy.com'
    }

    expect(StateWrapper.fromEvent({}, event1).sendsPixel()).to.be.false()

    const event2 = {
      eventName: 'setEmailHash',
      email: '  xxx@yyy.com'
    }

    expect(StateWrapper.fromEvent({}, event2).sendsPixel()).to.be.false()

    const event3 = {
      eventName: 'setHashedEmail',
      email: '  xxx@yyy.com'
    }

    expect(StateWrapper.fromEvent({}, event3).sendsPixel()).to.be.false()

    const event4 = {
      eventName: 'setContent',
      email: '  xxx@yyy.com'
    }

    expect(StateWrapper.fromEvent({}, event4).sendsPixel()).to.be.true()
  })

  it('should limit the number of items', () => {
    const pixelData = {
      decisionIds: []
    }
    const providedItems = Array.from(Array(50).keys())
    const providedItemsCopy = [...providedItems]
    const event = StateWrapper.fromEvent(pixelData, { items: providedItems })
    expect(event.asQuery().toQueryString()).to.eql('?se=eyJpdGVtcyI6WzAsMSwyLDMsNCw1LDYsNyw4LDldfQ')
    // Making sure this works and that we're not changing the object for the customer
    expect(providedItems).to.eql(providedItemsCopy)
  })

  it('should send distributorId using the short name: did', () => {
    const eventBus = LocalEventBus()
    const pixelData = {
      distributorId: 'did-9898',
      liveConnectId: '213245'
    }
    const event = StateWrapper.fromEvent(pixelData, {}, eventBus)

    expect(event.data).to.eql({
      distributorId: 'did-9898',
      liveConnectId: '213245',
      eventSource: {}
    })
    expect(event.asQuery().toQueryString()).to.eql('?did=did-9898&se=e30&duid=213245')
  })

  it('should send ic if idcookie is resolved', () => {
    const eventBus = LocalEventBus()
    const resolvedIdCookie = '123'
    const pixelData = { resolvedIdCookie }
    const event = StateWrapper.fromEvent(pixelData, {}, eventBus)

    expect(event.data).to.eql({
      resolvedIdCookie,
      eventSource: {}
    })
    expect(event.asQuery().toQueryString()).to.eql(`?se=e30&ic=${resolvedIdCookie}`)
  })

  it('should send empty ic if idcookie fails to be resolved', () => {
    const eventBus = LocalEventBus()
    const pixelData = {
      resolvedIdCookie: null
    }
    const event = StateWrapper.fromEvent(pixelData, {}, eventBus)

    expect(event.data).to.eql({
      resolvedIdCookie: null,
      eventSource: {}
    })
    expect(event.asQuery().toQueryString()).to.eql('?se=e30&ic=')
  })

  it('should extract ipv4', () => {
    const eventBus = LocalEventBus()
    const eventSource = {
      ipv4: '127.0.0.1'
    }
    const event = StateWrapper.fromEvent({}, eventSource, eventBus)

    expect(event.asQuery().toQueryString()).to.eql('?se=eyJpcHY0IjoiMTI3LjAuMC4xIn0&pip=MTI3LjAuMC4x')
  })

  it('should extract ipv6', () => {
    const eventBus = LocalEventBus()
    const eventSource = {
      ipv6: '4c15:c00b:125f:4c5c:66db:5c16:05bb:0fc5'
    }
    const event = StateWrapper.fromEvent({}, eventSource, eventBus)

    expect(event.asQuery().toQueryString()).to.eql('?se=eyJpcHY2IjoiNGMxNTpjMDBiOjEyNWY6NGM1Yzo2NmRiOjVjMTY6MDViYjowZmM1In0&pip6=NGMxNTpjMDBiOjEyNWY6NGM1Yzo2NmRiOjVjMTY6MDViYjowZmM1')
  })

  it('should extract userAgent', () => {
    const eventBus = LocalEventBus()
    const eventSource = {
      userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'
    }
    const event = StateWrapper.fromEvent({}, eventSource, eventBus)

    expect(event.asQuery().toQueryString()).to.eql('?se=eyJ1c2VyQWdlbnQiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCA2LjE7IFdpbjY0OyB4NjQ7IHJ2OjQ3LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvNDcuMCJ9')
    expect(event.asHeaders()).to.eql({
      'X-LI-Provided-User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'
    })
  })
})
