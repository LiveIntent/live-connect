import { expect, use } from 'chai'
import { enrichDecisionIds } from '../../../src/enrichers/decisions'
import { DefaultStorageHandler } from 'live-connect-handlers'
// @ts-expect-error
import uuid from 'tiny-uuid4'
import sinon, { SinonSandbox } from 'sinon'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { withResource } from '../test-utils/with-resources'
import { EventBus } from 'live-connect-common'

use(dirtyChai)

describe('DecisionsManager for stored decisions', () => {
  let eventBus: EventBus
  let externalStorage: DefaultStorageHandler
  let storage: WrappedStorageHandler

  const cookieDomain = 'example.com'

  beforeEach(() => {
    eventBus = LocalEventBus()
    externalStorage = new DefaultStorageHandler(eventBus)
    storage = WrappedStorageHandler.make('cookie', externalStorage, eventBus)

    jsdom('', {
      url: 'http://www.something.example.com'
    })
  })

  it('should return an empty string if nothing is in the cookie jar', () => {
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain })
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return an empty string if the cookie jar has invalid uuids', () => {
    storage.setCookie('lidids.', '2134')
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain })
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should return the stored decision', () => {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId)
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain })
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })

  it('should not return empty values', () => {
    storage.setCookie('lidids.', '')
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain })
    expect(resolutionResult.decisionIds.length).to.eql(0)
  })

  it('should return unique decision ids', () => {
    const decisionId = uuid()
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'something.example.com')
    storage.setCookie('lidids.123', decisionId, undefined, undefined, 'www.something.example.com')
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain })
    expect(resolutionResult.decisionIds).to.eql([decisionId])
  })
})

describe('DecisionsManager for new decisions', () => {
  let sandbox: SinonSandbox
  let eventBus: EventBus
  let externalStorage: DefaultStorageHandler
  let storage: WrappedStorageHandler

  const cookieDomain = 'example.com'

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    eventBus = LocalEventBus()
    externalStorage = new DefaultStorageHandler(eventBus)
    storage = WrappedStorageHandler.make('cookie', externalStorage, eventBus)

    jsdom('', {
      url: 'http://subdomain.tests.example.com'
    })
  })

  it('should return the new decision id, and store it', () => {
    const decisionId = uuid()
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` })
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should return the new decision id, and store it', () => {
    const decisionId = uuid()
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` })
    expect(resolutionResult.decisionIds).to.eql([decisionId])
    expect(storage.getCookie(`lidids.${decisionId}`)).to.eq(decisionId)
  })

  it('should not return the new decision id if its not a uuid', () => {
    const decisionId = `${uuid()}sometghing`
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionId}` })
    expect(resolutionResult.decisionIds).to.eql([])
  })

  it('should combine the new cookie and the stored one', () => {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=    ${decisionIdTwo}` })
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
  })

  it('should combine the new cookies and the stored one', () => {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` })
    expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
    expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
    expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
  })

  it('should return the new decision id if look up of stored decision ids fails', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const stub = sandbox.stub(storage, 'findSimilarCookies').throws()

    let errorEmitted = false
    eventBus.once('li_errors', () => { errorEmitted = true })

    withResource(
      stub,
      stub => stub.restore(),
      () => {
        expect(errorEmitted).to.eq(false)
        const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` })
        expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree])
        expect(storage.getCookie(`lidids.${decisionIdTwo}`)).to.eq(decisionIdTwo)
        expect(storage.getCookie(`lidids.${decisionIdThree}`)).to.eq(decisionIdThree)
        expect(errorEmitted).to.eq(true)
      })
  })

  it('should return the new decision id and stored decision id if storing new decision id fails', function () {
    const decisionIdOne = uuid()
    const decisionIdTwo = uuid()
    const decisionIdThree = uuid()
    storage.setCookie('lidids.123', decisionIdOne)
    const stub = sandbox.stub(storage, 'setCookie').throws()

    let errorEmitted = false
    eventBus.once('li_errors', () => { errorEmitted = true })

    withResource(
      stub,
      stub => stub.restore(),
      () => {
        expect(errorEmitted).to.eq(false)
        const resolutionResult = enrichDecisionIds(storage, eventBus)({ cookieDomain, pageUrl: `http://subdomain.tests.example.com/cake?li_did=${decisionIdTwo}&li_did=${decisionIdThree}` })
        expect(resolutionResult.decisionIds).to.eql([decisionIdTwo, decisionIdThree, decisionIdOne])
        expect(errorEmitted).to.eq(true)
      })
  })
})
