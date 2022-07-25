import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { urlParams } from '../../src/utils/url'
import { expect, use } from 'chai'
import { StandardLiveConnect } from '../../src/standard-live-connect'
import { base64UrlEncode } from '../../src/utils/b64'
import * as C from '../../src/utils/consts'
import * as storage from '../shared/utils/storage'
import * as calls from '../shared/utils/calls'
import { hashEmail } from '../../src/utils/hash'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('StandardLiveConnect', () => {
  const sandbox = sinon.createSandbox()
  let imgStub = null
  let pixelCalls = []
  let errorCalls = []
  jsdom({
    url: 'http://www.example.com/?sad=0&dsad=iou',
    useEach: true
  })

  afterEach(() => {
    imgStub.restore()
  })

  beforeEach(() => {
    pixelCalls = []
    errorCalls = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = function (xhr) {
      pixelCalls.push(xhr)
    }
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').callsFake(() => {
      const obj = {
        onload: onload
      }
      errorCalls.push(obj)
      return obj
    })
  })

  it('should initialise the event bus, and hook the error handler', function () {
    StandardLiveConnect({})
    const windowBus = window[C.EVENT_BUS_NAMESPACE].current
    const errorHandler = windowBus.h
    expect(errorHandler).to.have.key(C.ERRORS_PREFIX)
    expect(errorHandler[C.ERRORS_PREFIX].length).to.be.eql(1)
    expect(errorHandler[C.ERRORS_PREFIX][0].fn.name).to.eql('_pixelError')
  })

  it('should expose liQ', function () {
    expect(window.liQ).to.be.undefined()
    StandardLiveConnect({}, storage, calls)
    expect(window.liQ.ready).to.be.true()
  })

  it('should expose liQ, emit error for any subsequent initialization with different config', function () {
    StandardLiveConnect({ appId: 'a-00xx' }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    StandardLiveConnect({ appId: 'config' }, storage, calls)
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

  it('should replace liQ when config with appId is provided', function () {
    StandardLiveConnect({ }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'none' })
    StandardLiveConnect({ appId: 'a-00xx' }, storage, calls)
    liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    expect(pixelCalls.length).to.eql(2)
    const firstAppIdEventSrc = pixelCalls[0].url
    const secondAppIdEventSrc = pixelCalls[1].url

    const firstCallParams = urlParams(firstAppIdEventSrc)
    const secondCallParams = urlParams(secondAppIdEventSrc)
    expect(firstCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(firstCallParams.aid).to.eql(undefined)
    expect(firstCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"none"}'))
    expect(secondCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(secondCallParams.aid).to.eql('a-00xx')
    expect(secondCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"a-00xx"}'))
  })

  it('should replace liQ when config with appId is pushed', function () {
    StandardLiveConnect({ }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'none' })
    liQ.push({ config: { appId: 'a-00xx' } })
    liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    expect(pixelCalls.length).to.eql(2)
    const firstAppIdEventSrc = pixelCalls[0].url
    const secondAppIdEventSrc = pixelCalls[1].url

    const firstCallParams = urlParams(firstAppIdEventSrc)
    const secondCallParams = urlParams(secondAppIdEventSrc)
    expect(firstCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(firstCallParams.aid).to.eql(undefined)
    expect(firstCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"none"}'))
    expect(secondCallParams.duid).to.eql(liQ.peopleVerifiedId)
    expect(secondCallParams.aid).to.eql('a-00xx')
    expect(secondCallParams.se).to.eql(base64UrlEncode('{"event":"viewProduct","name":"a-00xx"}'))
  })

  it('should expose liQ, and not emit error when the config has not changed', function () {
    StandardLiveConnect({ appId: 'a-00xx' }, storage, calls)
    let liQ = window.liQ
    expect(liQ.ready).to.be.true()
    liQ.push({ event: 'viewProduct', name: 'a-00xx' })
    StandardLiveConnect({ appId: 'a-00xx' }, storage, calls)
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

  it('should process a previously initialized liQ', function () {
    window.liQ = []
    window.liQ.push({ event: 'viewProduct', name: 'first' }, { event: 'viewProduct', name: 'second' })
    StandardLiveConnect({ appId: 'a-00xx' }, storage, calls)
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

  it('should set the cookie', function () {
    StandardLiveConnect({}, storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a bust', function () {
    StandardLiveConnect(null, storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a string', function () {
    StandardLiveConnect('hello dave', storage, calls)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should accept a single event and send it', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ event: 'some' })
    expect(pixelCalls.length).to.eql(1)
    const params = urlParams(pixelCalls[0].url)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{"event":"some"}'))
  })

  it('should accept an emailHash, not send an event, and then include the HEM in the next call', function () {
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

  it('send an empty event when fired', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.fire()
    expect(pixelCalls.length).to.eql(1)
    const params = urlParams(pixelCalls[0].url)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{}'))
  })

  it('should accept multiple events and send them', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push({ event: 'some' }, { event: 'another' })
    expect(pixelCalls.length).to.eql(2)
    pixelCalls.forEach(call => {
      const params = urlParams(call.url)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should accept multiple events in an array and send them', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push([{ event: 'some' }, { event: 'another' }])
    expect(pixelCalls.length).to.eql(2)
    pixelCalls.forEach(call => {
      const params = urlParams(call.url)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should return the resolution Url', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    expect(lc.resolutionCallUrl()).to.match(/https:\/\/idx.liadm.com\/idex\/unknown\/any\?duid=0caaf24ab1a0--.*/)
  })

  it('should expose the config', function () {
    const config = { appId: 'a-00xx' }
    const lc = StandardLiveConnect(config, storage, calls)
    expect(lc.config).to.eql(config)
  })

  it('should emit an error if the pushed value is not an object', function () {
    const lc = StandardLiveConnect({}, storage, calls)
    lc.push([[[[[':)']]]]])
    expect(errorCalls.length).to.eql(1)
    const params = urlParams(errorCalls[0].src)
    // I don't want to check the full content here, i'm fine with just being present
    expect(params.ae).to.not.eq(undefined)
  })

  it('should emit an error if the pushed value is a config without appId and current config has an appId', function () {
    const lc = StandardLiveConnect({ appId: 'a-0007' }, storage, calls)
    lc.push({ config: {} })
    expect(errorCalls.length).to.eql(1)
    const params = urlParams(errorCalls[0].src)
    // I don't want to check the full content here, i'm fine with just being present
    expect(params.ae).to.not.eq(undefined)
  })

  it('should emit an error if the storage and ajax are not provided', function () {
    StandardLiveConnect({}, undefined, { pixelGet: calls.pixelGet })
    expect(errorCalls.length).to.eql(2)
    expect(urlParams(errorCalls[0].src).ae).to.not.be.undefined()
    expect(urlParams(errorCalls[1].src).ae).to.not.be.undefined()
  })
})
