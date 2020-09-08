import { assert, expect } from 'chai'
import { StateWrapper } from '../../../src/pixel/state'
import { hashEmail } from '../../../src/utils/hash'

describe('EventComposition', () => {
  it('should construct an event out of anything', function () {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    expect(event.data).to.eql(pixelData)
  })

  it('should construct valid tuples for valid members', function () {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898']])
  })

  it('should construct valid params for valid members', function () {
    const pixelData = { appId: '9898' }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql('?aid=9898')
  })

  it('should ignore unknown fields', function () {
    const pixelData = {
      appId: '9898',
      randomField: 2135523
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql('?aid=9898')
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898']])
  })

  it('should base64 the source', function () {
    const pixelData = {
      appId: '9898',
      eventSource: { eventName: 'viewContent' }
    }
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]])
  })

  it('should send the usPrivacyString', function () {
    const pixelData = {
      usPrivacyString: '1---'
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql('?us_privacy=1---')
    assert.includeDeepMembers(event.asTuples(), [['us_privacy', '1---']])
  })

  it('should send the legacyId', function () {
    const legacyDuid = 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0'
    const pixelData = {
      appId: '9898',
      eventSource: { eventName: 'viewContent' },
      legacyId: {
        duid: legacyDuid,
      }
    }
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&lduid=${legacyDuid}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource], ['lduid', legacyDuid]])
  })

  it('should send the gdprApplies & gdprConsent', function () {
    const legacyDuid = 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0'
    const pixelData = {
      eventSource: { eventName: 'viewContent' },
      gdprApplies: true,
      gdprConsent: 'some-string'
    }
    const event = new StateWrapper(pixelData)
    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCJ9'
    expect(event.asQueryString()).to.eql(`?se=${b64EncodedEventSource}&gdpr=true&gdpr_consent=some-string`)
    assert.includeDeepMembers(event.asTuples(), [['se', b64EncodedEventSource], ['gdpr', 'true'], ['gdpr_consent', 'some-string']])
  })

  it('should send the tracker name', function () {
    const trackerName = 'some-name'
    const pixelData = {
      trackerName: trackerName
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql(`?tna=${trackerName}`)
    assert.includeDeepMembers(event.asTuples(), [['tna', trackerName]])
  })

  it('should send the page url', function () {
    const pageUrl = 'https://wwww.example.com?sss'
    const pixelData = {
      pageUrl: pageUrl
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql(`?pu=${encodeURIComponent(pageUrl)}`)
    assert.includeDeepMembers(event.asTuples(), [['pu', encodeURIComponent(pageUrl)]])
  })

  it('should send the application error', function () {
    const applicationError = { someKey: 'value' }
    const pixelData = {
      errorDetails: applicationError
    }
    const event = new StateWrapper(pixelData)
    const b64EncodedEventSource = 'eyJzb21lS2V5IjoidmFsdWUifQ'
    expect(event.asQueryString()).to.eql(`?ae=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['ae', b64EncodedEventSource]])
  })

  it('should update the data', function () {
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
    expect(newEvent.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&duid=213245`)
    assert.includeDeepMembers(newEvent.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource], ['duid', '213245']])

    expect(event.data).to.eql(pixelData)
    expect(event.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]])
  })

  it('should send the provided email hash', function () {
    const pixelData = {
      appId: '9898',
      eventSource: {
        eventName: 'viewContent',
        email: '  e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72    '
      }
    }

    const b64EncodedEventSource = 'eyJldmVudE5hbWUiOiJ2aWV3Q29udGVudCIsImVtYWlsIjoiICBlMTY4ZTBlZGExMWY0ZmJiOGZiZDdjZmU1Zjc1MGNkMGY3ZTdmNGQ4NjQ5ZGE2OGUwNzNlOTI3NTA0ZWM1ZDcyICAgICJ9'
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource], ['e', 'e168e0eda11f4fbb8fbd7cfe5f750cd0f7e7f4d8649da68e073e927504ec5d72']])
  })

  it('should never send emails as plain text, and hash the email that is set in the source', function () {
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
    expect(event.asQueryString()).to.eql(`?aid=9898&se=${b64EncodedEventSource}&e=${hashes.md5}%2C${hashes.sha1}%2C${hashes.sha256}`)
    assert.includeDeepMembers(event.asTuples(), [['aid', '9898'], ['se', b64EncodedEventSource]], ['e', [`${hashes.md5},${hashes.sha1},${hashes.sha256}`]])
  })

  it('should send the retrieved identifiers', function () {
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

    expect(event.asQueryString()).to.eql(`?ext_${cookie1.name}=${cookie1.value}&ext_${cookie2.name}=${cookie2.value}`)
    assert.includeDeepMembers(event.asTuples(), [
      [`ext_${cookie1.name}`, cookie1.value], [`ext_${cookie2.name}`, cookie2.value]
    ])
  })

  it('should send the hashes found in retrieved identifiers', function () {
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

    expect(event.asQueryString()).to.eql(`?scre=${hashes1.md5},${hashes1.sha1},${hashes1.sha256}&scre=${hashes2.md5},${hashes2.sha1},${hashes2.sha256}`)
    assert.includeDeepMembers(event.asTuples(), [
      ['scre', `${hashes1.md5},${hashes1.sha1},${hashes1.sha256}`],
      ['scre', `${hashes2.md5},${hashes2.sha1},${hashes2.sha256}`]
    ])
  })

  it('should send decisionIds ', function () {
    const pixelData = {
      decisionIds: ['1', '2']
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql('?li_did=1%2C2')
    assert.includeDeepMembers(event.asTuples(), [['li_did', '1%2C2']])
  })

  it('should not send decisionIds if array is empty', function () {
    const pixelData = {
      decisionIds: []
    }
    const event = new StateWrapper(pixelData)
    expect(event.asQueryString()).to.eql('')
    assert.includeDeepMembers(event.asTuples(), [])
  })

  it('should not send an event if the event is just setting a HEM', function () {
    expect(new StateWrapper({
      eventSource: {
        eventName: 'setEmail',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setEmailHash',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setHashedEmail',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.false

    expect(new StateWrapper({
      eventSource: {
        eventName: 'setContent',
        email: '  xxx@yyy.com'
      }
    }).sendsPixel()).to.be.true
  })

  it('should limit the number of items', function () {
    const pixelData = {
      decisionIds: []
    }
    const event = new StateWrapper(pixelData)
    const eventWithItems = event.combineWith({
      eventSource: { items: Array.from(Array(50).keys()) }
    })
    expect(eventWithItems.asQueryString()).to.eql('?se=eyJpdGVtcyI6WzAsMSwyLDMsNCw1LDYsNyw4LDldfQ')
    assert.includeDeepMembers(eventWithItems.asTuples(), [['se', 'eyJpdGVtcyI6WzAsMSwyLDMsNCw1LDYsNyw4LDldfQ']])
    // Making sure this works and that we're not changing the object for the customer
    expect(event.data).to.eql(pixelData)
  })
})
