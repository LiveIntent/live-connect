// @ts-nocheck

import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { urlParams } from '../../src/utils/url'
import { expect, use } from 'chai'
import { StandardLiveConnect, LiveConnect } from '../../src'
import { base64UrlEncode } from '../../src/utils/b64'
import { ERRORS_CHANNEL } from 'live-connect-common'
import { DefaultStorageHandler, DefaultCallHandler } from 'live-connect-handlers'
import { hashEmail } from '../../src/utils/hash'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../src/events/event-bus'
import { WrappedStorageHandler } from '../../src/handlers/storage-handler'

use(dirtyChai)
const eventBus = LocalEventBus()
const storage = WrappedStorageHandler.make('cookie', new DefaultStorageHandler(eventBus), eventBus)
const calls = new DefaultCallHandler()

describe('StandardLiveConnect', () => {
  const sandbox = sinon.createSandbox()
  let imgStub = null
  let pixelCalls = []
  let errorCalls = []

  afterEach(() => {
    imgStub.restore()
  })

  beforeEach(() => {
    jsdom('', {
      url: 'https://www.example.com/?sad=0&dsad=iou'
    })

    pixelCalls = []
    errorCalls = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = xhr => pixelCalls.push(xhr)
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').callsFake(() => {
      const obj = { onload }
      errorCalls.push(obj)
      return obj
    })
  })

  it('should initialise liQ_instances and add the new instance', () => {
    const lc = StandardLiveConnect()
    expect(window.liQ_instances).to.have.members([lc])
  })

  it('should initialise the event bus, and hook the error handler', () => {
    StandardLiveConnect({ globalVarName: 'liQ' })
    const eventBus = window.liQ.eventBus
    const errorHandler = eventBus.data.h
    expect(errorHandler).to.have.key(ERRORS_CHANNEL)
    expect(errorHandler[ERRORS_CHANNEL].length).to.be.eql(1)
  })

  it('should initialise the event bus, and hook the error handler via the initializer', () => {
    LiveConnect({ globalVarName: 'liQ' })
    const eventBus = window.liQ.eventBus
    const errorHandler = eventBus.data.h
    expect(errorHandler).to.have.key(ERRORS_CHANNEL)
    expect(errorHandler[ERRORS_CHANNEL].length).to.be.eql(1)
    expect(window.liQ_instances).to.have.members([window.liQ])
  })

  it('should expose liQ', () => {
    expect(window.liQ).to.be.undefined()
    StandardLiveConnect({ globalVarName: 'liQ' }, storage, calls)
    expect(window.liQ.ready).to.be.true()
  })

  it('should only add liQ_intances to the window object', () => {
    const exisitingKeys = Object.keys(window)
    StandardLiveConnect({}, storage, calls)
    const keysAfterInit = Object.keys(window)
    const constNewKeys = keysAfterInit.filter(v => !exisitingKeys.includes(v))
    expect(constNewKeys).to.be.eql(['liQ_instances'])
  })

  it('should expose liQ, emit error for any subsequent initialization with different config', () => {
    StandardLiveConnect({ globalVarName: 'liQ', appId: 'a-00xx' }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    StandardLiveConnect({ globalVarName: 'liQ', appId: 'config' }, storage, calls)
    liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'config' })
    expect(pixelCalls.length).to.eql(2)
    expect(errorCalls.length).to.eql(1)
    const firstAppIdEventSrc = pixelCalls[0].url
    const duplicationNotificationSrc = errorCalls[0].src
    const secondAppIdEventSrc = pixelCalls[1].url

    const firstCallParams = urlParams(firstAppIdEventSrc)
    const duplicationParams = urlParams(duplicationNotificationSrc)
    const secondCallParams = urlParams(secondAppIdEventSrc)
    expect(firstCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(firstCallParams.aid).to.eql('a-00xx')
    expect(firstCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"a-00xx"}'))
    expect(duplicationParams.aid).to.eql('a-00xx')
    expect(duplicationParams.ae).to.not.be.empty()
    expect(secondCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(secondCallParams.aid).to.eql('a-00xx')
    expect(secondCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"config"}'))
  })

  it('should expose liQ, and not emit error when the config has not changed', () => {
    StandardLiveConnect({ globalVarName: 'liQ', appId: 'a-00xx' }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    StandardLiveConnect({ globalVarName: 'liQ', appId: 'a-00xx' }, storage, calls)
    liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'config' })
    expect(pixelCalls.length).to.eql(2)
    expect(errorCalls.length).to.eql(0)
    const firstAppIdEventSrc = pixelCalls[0].url
    const secondAppIdEventSrc = pixelCalls[1].url

    const firstCallParams = urlParams(firstAppIdEventSrc)
    const secondCallParams = urlParams(secondAppIdEventSrc)
    expect(firstCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(firstCallParams.aid).to.eql('a-00xx')
    expect(firstCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"a-00xx"}'))
    expect(secondCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(secondCallParams.aid).to.eql('a-00xx')
    expect(secondCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"config"}'))
  })

  it('should process a previously initialized liQ', () => {
    window.liQ = []
    window.liQ.push({ event: 'viewProduct', name: 'first' }, { event: 'viewProduct', name: 'second' })
    StandardLiveConnect({ globalVarName: 'liQ', appId: 'a-00xx' }, storage, calls)
    const liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'third' })
    expect(pixelCalls.length).to.eql(3)
    pixelCalls.forEach(call => {
      const params = urlParams(call.url)
      expect(params.duid).to.eql(liQ.peopleVerifiedId)
      expect(params.aid).to.eql('a-00xx')
    })
  })

  it('should set the cookie', () => {
    StandardLiveConnect({}, storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a bust', () => {
    StandardLiveConnect(null, storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a string', () => {
    StandardLiveConnect('hello dave', storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should accept a single event and send it', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ event: 'some' })
    expect(pixelCalls.length).to.eql(1)
    const params = urlParams(pixelCalls[0].url)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{"event":"some"}'))
  })

  it('should accept an emailHash, not send an event, and then include the HEM in the next call', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ event: 'setEmail', email: '    steve@liveIntent.com   ' })
    lc.push({ event: 'pageView' })
    expect(pixelCalls.length).to.eql(1)
    const hashes = hashEmail('steve@liveintent.com')
    const params = urlParams(pixelCalls[0].url)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{"event":"pageView"}'))
    expect(params.e).to.eql(`${hashes.md5},${hashes.sha1},${hashes.sha256}`)
  })

  it('send an empty event when fired', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.fire()
    expect(pixelCalls.length).to.eql(1)
    const params = urlParams(pixelCalls[0].url)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{}'))
  })

  it('should accept multiple events and send them', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ event: 'some' }, { event: 'another' })
    expect(pixelCalls.length).to.eql(2)
    pixelCalls.forEach(call => {
      const params = urlParams(call.url)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should accept multiple events in an array and send them', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push([{ event: 'some' }, { event: 'another' }])
    expect(pixelCalls.length).to.eql(2)
    pixelCalls.forEach(call => {
      const params = urlParams(call.url)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should return the resolution Url', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    expect(lc.resolutionCallUrl()).to.match(/https:\/\/idx.liadm.com\/idex\/unknown\/any\?duid=0caaf24ab1a0--.*/)
  })
  it('should emit an error if the storage and ajax are not provided', () => {
    StandardLiveConnect({}, undefined, { pixelGet: calls.pixelGet })
    expect(errorCalls.length).to.eql(2)
    expect(urlParams(errorCalls[0].src).ae).to.not.be.undefined()
    expect(urlParams(errorCalls[1].src).ae).to.not.be.undefined()
  })

  it('should expose the LC instance as globalVarName instead of liQ when provided', () => {
    expect(window.liQTest).to.be.undefined()
    expect(window.liQ).to.be.undefined()
    StandardLiveConnect({ globalVarName: 'liQTest' }, storage, calls)
    expect(window.liQTest.ready).to.be.true()
    expect(window.liQy).to.be.undefined()
    expect(window.liQ_instances).to.have.members([window.liQTest])
  })

  it('should expose the config', () => {
    const config = { appId: 'a-00xx', contextElementsLength: 0, contextSelectors: '', identifiersToResolve: [] }
    const lc = StandardLiveConnect(config, storage, calls)
    expect(lc.config).to.eql(config)
  })

  it('should emit an error if the pushed value is not an object', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push([[[[[':)']]]]])
    expect(errorCalls.length).to.eql(1)
    const params = urlParams(errorCalls[0].src)
    // I don't want to check the full content here, i'm fine with just being present
    expect(params.ae).to.not.eq(undefined)
  })

  it('should emit an error if the pushed value is a config', () => {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ config: {} })
    expect(errorCalls.length).to.eql(1)
    const params = urlParams(errorCalls[0].src)
    // I don't want to check the full content here, i'm fine with just being present
    expect(params.ae).to.not.eq(undefined)
  })

  it('should remove distributorId when both appId and distributorId are present', () => {
    const config = { appId: 'a-00xx', distributorId: 'did-00xx', globalVarName: 'liQTest' }
    const lc = StandardLiveConnect(config, storage, calls)
    const expectedConfig = { appId: 'a-00xx', globalVarName: 'liQTest', contextElementsLength: 0, contextSelectors: '', identifiersToResolve: [] }
    expect(lc.config).to.eql(expectedConfig)
  })

  it('should expose the eventBus through the LC instance', () => {
    const lc = StandardLiveConnect({ globalVarName: 'liQ' }, storage, calls)
    expect(lc.eventBus).to.not.be.undefined()
  })
})
