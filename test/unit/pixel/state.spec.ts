// @ts-nocheck
import { assert, expect, use } from 'chai'
import { hashEmail } from '../../../src/utils/hash'
import { enrich as privacyConfig } from '../../../src/enrichers/privacy-config'
import { StateWrapper } from '../../../src/pixel/state'
import { mergeObjects } from '../../../src/pixel/fiddler'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { UrlCollectionModes } from '../../../src/model/url-collection-mode'

use(dirtyChai)

const COMMA = encodeURIComponent(',')
describe('EventComposition', () => {
  it('should construct an event out of anything', () => {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    expect(event.data).to.eql(pixelData)
  })

  it('should construct valid tuples for valid members', () => {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898']])
  })

  it('should construct valid params for valid members', () => {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898')
  })

  it('should ignore empty fields', () => {
    const pixelData = { appId: '9898', contextElements: '' }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898')
  })

  it('should append c parameter last', () => {
    const pixelData = {
      contextElements: '<title>This title is a test</title>',
      appId: '9898',
      eventSource: { eventName: 'viewContent' },
      liveConnectId: '213245',
      trackerName: 'test tracker',
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
      gdprApplies: true,
      gdprConsent: 'test-consent-string',
      referrer: 'https://some.test.referrer.com'
    }
    const event = new StateWrapper(mergeObjects(pixelData, privacyConfig(pixelData)))

    const expectedPairs = [
      'aid=9898', // appId
      'se=eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9', // base64 of eventSource
      'duid=213245', // liveConnectId
      'tna=test%20tracker', // trackerName
      'pu=https%3A%2F%2Fwwww.example.com%3Fsss', // pageUrl
      'ae=eyJ0ZXN0RXJyb3IiOiJ0ZXN0RXJyb3IifQ', // base64 of errorDetails
      'ext_sample_cookie=sample_value', // retrievedIdentifiers
      'scre=75524519292e51ad6f761baa82d07d76%2Cec3685d99c376b4ee14a5b985a05fc23e21235cb%2Ce168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72', // comma-separated hashesFromIdentifiers
      'li_did=1%2C2', // decisionIds
      'e=eb2684ead8e942b6c4dc7465de66460a', // hashedEmail
      'us_privacy=1---', // usPrivacyString
      'wpn=test%20wrapper%20name', // wrapperName
      'gdpr=1', // gdprApplies
      'n3pc=1', // privacyMode
      'n3pct=1', // privacyMode
      'nb=1', // privacyMode
      'gdpr_consent=test-consent-string', // gdprConsent
      'refr=https%3A%2F%2Fsome.test.referrer.com', // referrer
      'c=%3Ctitle%3EThis%20title%20is%20a%20test%3C%2Ftitle%3E' // contextElements, low priority parameter
    ]
    expect(event.asQuery().toQueryString()).to.eql('?'.concat(expectedPairs.join('&')))
  })

  it('should set n3pc, n3pct and nb to 1, and gdpr to 1 when the gdprApplies is defined but has a non boolean value', () => {
    const pixelData = {
      contextElements: '<title>This title is a test</title>',
      appId: '9898',
      eventSource: { eventName: 'viewContent' },
      liveConnectId: '213245',
      trackerName: 'test tracker',
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
      gdprApplies: 'a',
      gdprConsent: 'test-consent-string',
      referrer: 'https://some.test.referrer.com'
    }
    const event = new StateWrapper(mergeObjects(pixelData, privacyConfig(pixelData)))

    const expectedPairs = [
      'aid=9898', // appId
      'se=eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9', // base64 of eventSource
      'duid=213245', // liveConnectId
      'tna=test%20tracker', // trackerName
      'pu=https%3A%2F%2Fwwww.example.com%3Fsss', // pageUrl
      'ae=eyJ0ZXN0RXJyb3IiOiJ0ZXN0RXJyb3IifQ', // base64 of errorDetails
      'ext_sample_cookie=sample_value', // retrievedIdentifiers
      'scre=75524519292e51ad6f761baa82d07d76%2Cec3685d99c376b4ee14a5b985a05fc23e21235cb%2Ce168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72', // comma-separated hashesFromIdentifiers
      'li_did=1%2C2', // decisionIds
      'e=eb2684ead8e942b6c4dc7465de66460a', // hashedEmail
      'us_privacy=1---', // usPrivacyString
      'wpn=test%20wrapper%20name', // wrapperName
      'gdpr=1', // gdprApplies
      'n3pc=1', // privacyMode
      'n3pct=1', // privacyMode
      'nb=1', // privacyMode
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
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('?aid=9898')
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898']])
  })

  it('should base64 the source', () => {
    const pixelData = {
      appId: '9898',
      eventSource: { eventName: 'viewContent' }
    }
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]])
  })

  it('should send the usPrivacyString', () => {
    const pixelData = {
      usPrivacyString: '1---'
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('?us_privacy=1---')
    assert.includeDeepMembers(event.asTuples(), [['us_privacy', '1---']])
  })

  it('should send the gdpr, n3pc, n3pct, nb as 1 & gdprConsent', () => {
    const pixelData = {
      eventSource: { eventName: 'viewContent' },
      gdprApplies: true,
      gdprConsent: 'some-string'
    }
    const event = new StateWrapper(mergeObjects(pixelData, privacyConfig(pixelData)))
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    expect(event.asQuery().toQueryString()).to.eql(`?se=${b64EncodedEventSource}&gdpr=1&n3pc=1&n3pct=1&nb=1&gdpr_consent=some-string`)
    assert.includeDeepMembers(event.asTuples(), [['se', b64EncodedEventSource], ['gdpr', '1'], ['n3pc', '1'], ['n3pct', '1'], ['nb', '1'], ['gdpr_consent', 'some-string']])
  })

  it('should send the gdprApplies as 0 if false', () => {
    const pixelData = {
      eventSource: { eventName: 'viewContent' },
      gdprApplies: false,
      gdprConsent: 'some-string'
    }
    const event = new StateWrapper(mergeObjects(pixelData, privacyConfig(pixelData)))
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    expect(event.asQuery().toQueryString()).to.eql(`?se=${b64EncodedEventSource}&gdpr=0&gdpr_consent=some-string`)
    assert.includeDeepMembers(event.asTuples(), [['se', b64EncodedEventSource], ['gdpr', '0'], ['gdpr_consent', 'some-string']])
  })

  it('should send the tracker name', () => {
    const trackerName = 'some-name'
    const pixelData = { trackerName }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?tna=${trackerName}`)
    assert.includeDeepMembers(event.asTuples(), [['tna', trackerName]])
  })

  it('should ignore nullable fields for consent', () => {
    const trackerName = 'some-name'
    const pixelData = {
      trackerName,
      usPrivacyString: null,
      gdprApplies: null,
      gdprConsent: undefined,
      wrapperName: undefined
    }
    const event = new StateWrapper(mergeObjects(pixelData, privacyConfig(pixelData)))
    expect(event.asQuery().toQueryString()).to.eql(`?tna=${trackerName}`)
    assert.includeDeepMembers(event.asTuples(), [['tna', trackerName]])
  })

  it('should send the page url', () => {
    const pageUrl = 'https://wwww.example.com?sss'
    const pixelData = { pageUrl }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?pu=${encodeURIComponent(pageUrl)}`)
    assert.includeDeepMembers(event.asTuples(), [['pu', encodeURIComponent(pageUrl)]])
  })

  it('should send the removed parts of the page url', () => {
    const pageUrl = 'https://www.example.com/page?query=v1&foo=v2&bar=v3&id=v4'
    const pixelData = {
      pageUrl,
      urlCollectionMode: UrlCollectionModes.noPath,
      queryParametersFilter: '^(foo|bar)$'
    }
    const event = new StateWrapper(pixelData)
    const expectedUrl = 'https://www.example.com/?query=v1&id=v4'
    assert.includeDeepMembers(event.asTuples(), [['pu', encodeURIComponent(expectedUrl)]])
    assert.includeDeepMembers(event.asTuples(), [['pu_rp', '1']])
    assert.includeDeepMembers(event.asTuples(), [['pu_rqp', `foo${COMMA}bar`]])
    expect(event.asQuery().toQueryString()).to.eql(`?pu=${encodeURIComponent(expectedUrl)}&pu_rp=1&pu_rqp=foo${COMMA}bar`)
  })

  it('should not send the removed parts of the page url when nothing was removed', () => {
    const pageUrl = 'https://www.example.com/?query=v1&id=v2'
    const pixelData = {
      pageUrl,
      urlCollectionMode: UrlCollectionModes.noPath,
      queryParametersFilter: '^(foo|bar)$'
    }
    const event = new StateWrapper(pixelData)
    assert.includeDeepMembers(event.asTuples(), [['pu', encodeURIComponent(pageUrl)]])
    assert.notIncludeMembers(event.asTuples(), [['pu_rp', '0']])
    assert.notIncludeMembers(event.asTuples(), [['pu_rqp', '']])
    expect(event.asQuery().toQueryString()).to.eql(`?pu=${encodeURIComponent(pageUrl)}`)
  })

  it('should send the application error', () => {
    const applicationError = { someKey: 'value' }
    const pixelData = {
      errorDetails: applicationError
    }
    const event = new StateWrapper(pixelData)
    const b64EncodedEventSource = 'eyJzb21lS2V5IjoidmFsdWUifQ'
    expect(event.asQuery().toQueryString()).to.eql(`?ae=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['ae', b64EncodedEventSource]])
  })

  it('should update the data', () => {
    const pixelData = {
      appId: '9898',
      eventSource: { eventName: 'viewContent' }
    }
    const expectedData = {
      appId: '9898',
      eventSource: { eventName: 'viewContent' },
      liveConnectId: '213245'
    }
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    const event = new StateWrapper(pixelData)

    const newEvent = event.combineWith({ liveConnectId: '213245' })

    expect(newEvent.data).to.eql(expectedData)
    expect(newEvent.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&duid=213245`)
    assert.includeDeepMembers(newEvent.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource], ['duid', '213245']])

    expect(event.data).to.eql(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]])
  })

  it('should send the provided email hash', () => {
    const pixelData = {
      appId: '9898',
      eventSource: {
        eventName: 'viewContent',
        email: '  e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72    '
      }
    }

    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCIsImVtYWlsIjoiICBlMTY4ZTBlZGExMWY0ZmJiOGZiZDdjZmU1Zjc1MGNkMGY3ZTdmNGQ4NjQ5ZGE2OGUwNzNlOTI3NTA0ZWM1ZDcyICAgICJ9'
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource], ['e', 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72']])
  })

  it('should never send emails as plain text, and hash the email that is set in the source', () => {
    const pixelData = {
      appId: '9898',
      eventSource: {
        eventName: 'viewContent',
        email: '  xxx@yyy.com'
      }
    }

    const hashes = hashEmail('xxx@yyy.com')
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCIsImVtYWlsIjoiKioqKioqKioqIn0'
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=${hashes.md5}%2C${hashes.sha1}%2C${hashes.sha256}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]], ['e', [`${hashes.md5},${hashes.sha1},${hashes.sha256}`]])
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

    const event = new StateWrapper(pixelData)

    expect(event.asQuery().toQueryString()).to.eql(`?ext_${cookie1.name}=${cookie1.value}&ext_${cookie2.name}=${cookie2.value}`)
    assert.includeDeepMembers(event.asTuples(), [
      [`ext_${cookie1.name}`, cookie1.value], [`ext_${cookie2.name}`, cookie2.value]
    ])
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

    const event = new StateWrapper(pixelData)

    expect(event.asQuery().toQueryString()).to.eql(`?scre=${hashes1.md5}${COMMA}${hashes1.sha1}${COMMA}${hashes1.sha256}&scre=${hashes2.md5}${COMMA}${hashes2.sha1}${COMMA}${hashes2.sha256}`)
    assert.includeDeepMembers(event.asTuples(), [
      ['scre', `${hashes1.md5}${COMMA}${hashes1.sha1}${COMMA}${hashes1.sha256}`],
      ['scre', `${hashes2.md5}${COMMA}${hashes2.sha1}${COMMA}${hashes2.sha256}`]
    ])
  })

  it('should send decisionIds ', () => {
    const pixelData = {
      decisionIds: ['1', '2']
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql(`?li_did=1${COMMA}2`)
    assert.includeDeepMembers(event.asTuples(), [['li_did', `1${COMMA}2`]])
  })

  it('should not send decisionIds if array is empty', () => {
    const pixelData = {
      decisionIds: []
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('')
    assert.includeDeepMembers(event.asTuples(), [])
  })

  it('should not send an event if the event is just setting a HEM', () => {
    expect(new StateWrapper({
      eventSource: {
        eventName: 'setEmail',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false()

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setEmailHash',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false()

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setHashedEmail',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false()

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setContent',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.true()
  })

  it('should limit the number of items', () => {
    const pixelData = {
      decisionIds: []
    }
    const event = new StateWrapper(pixelData)
    const eventWithItems = event.combineWith({
      eventSource: { items: Array.from(Array(50).keys()) }
    })
    expect(eventWithItems.asQuery().toQueryString()).to.eql('?se=eyJpdGVtcyI6WzAsMSwyLDMsNCw1LDYsNyw4LDldfQ')
    assert.includeDeepMembers(eventWithItems.asTuples(), [['se', 'eyJpdGVtcyI6WzAsMSwyLDMsNCw1LDYsNyw4LDldfQ']])
    // Making sure this works and that we're not changing the object for the customer
    expect(event.data).to.eql(pixelData)
  })

  it('should send distributorId using the short name: did', () => {
    const eventBus = LocalEventBus()
    const pixelData = {
      distributorId: 'did-9898',
      liveConnectId: '213245'
    }
    const event = new StateWrapper(pixelData, eventBus)

    expect(event.data).to.eql(pixelData)
    expect(event.asQuery().toQueryString()).to.eql('?did=did-9898&duid=213245')
    assert.includeDeepMembers(event.asTuples(), [['did', 'did-9898'], ['duid', '213245']])
  })
})
