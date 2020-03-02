import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { urlParams } from '../../src/utils/url'
import { expect } from 'chai'
import { LiveConnect } from '../../src/live-connect'
import { base64UrlEncode } from '../../src/utils/b64'
import * as C from '../../src/utils/consts'
import * as storage from '../../src/utils/storage'
import { hashEmail } from '../../src/utils/hash'

describe('LiveConnect', () => {
  const sandbox = sinon.createSandbox()
  let imgStub = null
  let imagePixelsCreated = []
  jsdom({
    url: 'http://www.example.com/?sad=0&dsad=iou',
    useEach: true
  })

  afterEach(() => {
    imgStub.restore()
  })

  beforeEach(() => {
    imagePixelsCreated = []
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').callsFake(() => {
      const obj = {
        onload: onload
      }
      imagePixelsCreated.push(obj)
      return obj
    })
  })

  it('should initialise the event bus, and hook the error handler', function () {
    LiveConnect({})
    const windowBus = window[C.EVENT_BUS_NAMESPACE]
    const errorHandler = windowBus.handlers
    expect(errorHandler).to.have.key(C.ERRORS_PREFIX)
    expect(errorHandler[C.ERRORS_PREFIX].length).to.be.eql(1)
    expect(errorHandler[C.ERRORS_PREFIX][0].fn.name).to.eql('_pixelError')
  })

  it('should set the cookie', function () {
    LiveConnect({})
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a bust', function () {
    LiveConnect(null)
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should not break if the config is a string', function () {
    LiveConnect('hello dave')
    expect(storage.getCookie('_lc2_fpi')).to.not.eql(null)
  })

  it('should accept a single event and send it', function () {
    const lc = LiveConnect({})
    lc.push({ event: 'some' })
    expect(imagePixelsCreated.length).to.eql(1)
    const params = urlParams(imagePixelsCreated[0].src)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{"event":"some"}'))
  })

  it('should accept an emailHash, not send an event, and then include the HEM in the next call', function () {
    const lc = LiveConnect({})
    lc.push({ event: 'setEmail', email:'    steve@liveIntent.com   ' })
    lc.push({ event: 'pageView'})
    expect(imagePixelsCreated.length).to.eql(1)
    const hashes = hashEmail('steve@liveintent.com')
    const params = urlParams(imagePixelsCreated[0].src)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{"event":"pageView"}'))
    expect(params.e).to.eql(`${hashes.md5},${hashes.sha1},${hashes.sha256}`)
  })

  it('send an empty event when fired', function () {
    const lc = LiveConnect({})
    lc.fire()
    expect(imagePixelsCreated.length).to.eql(1)
    const params = urlParams(imagePixelsCreated[0].src)
    expect(params.duid).to.eql(lc.peopleVerifiedId)
    expect(params.se).to.eql(base64UrlEncode('{}'))
  })

  it('should accept multiple events and send them', function () {
    const lc = LiveConnect({})
    lc.push({ event: 'some' }, { event: 'another' })
    expect(imagePixelsCreated.length).to.eql(2)
    imagePixelsCreated.forEach(image => {
      const params = urlParams(image.src)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should accept multiple events in an array and send them', function () {
    const lc = LiveConnect({})
    lc.push([{ event: 'some' }, { event: 'another' }])
    expect(imagePixelsCreated.length).to.eql(2)
    imagePixelsCreated.forEach(image => {
      const params = urlParams(image.src)
      expect(params.duid).to.eql(lc.peopleVerifiedId)
    })
  })

  it('should return the resolution Url', function () {
    const lc = LiveConnect({})
    expect(lc.resolutionCallUrl()).to.match(/https:\/\/idx.liadm.com\/idex\/unknown\/any\?duid=0caaf24ab1a0--.*/)
  })

  it('emit an error if the pushed value is not an object', function () {
    const lc = LiveConnect({})
    lc.push([[[[[':)']]]]])
    expect(imagePixelsCreated.length).to.eql(1)
    const params = urlParams(imagePixelsCreated[0].src)
    // I don't want to check the full content here, i'm fine with just being present
    expect(params.ae).to.not.eq(undefined)
  })
})
