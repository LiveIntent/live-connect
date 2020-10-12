import { expect } from 'chai'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { PixelSender } from '../../../src/pixel/sender'
import * as C from '../../../src/utils/consts'
import * as bus from '../../../src/events/bus'
import * as calls from '../../shared/utils/calls'
import { StateWrapper } from '../../../src/pixel/state'

function stateStub () {
  return new StateWrapper({ trackerName: 'spec' })
}

describe('PixelSender', () => {
  let ajaxRequests = []
  let pixelRequests = []
  const sandbox = sinon.createSandbox()
  let pixelStub

  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  beforeEach(() => {
    ajaxRequests = []
    pixelRequests = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = function (xhr) {
      ajaxRequests.push(xhr)
    }
    pixelStub = sandbox.stub(calls, 'pixelGet').callsFake(
      (uri, onload) => {
        pixelRequests.push({
          uri: uri,
          onload: onload
        })
      }
    )
  })

  afterEach(() => {
    pixelStub.restore()
  })

  it('exposes the send and sendPixel functions', function () {
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, null)
    expect(typeof sender.sendAjax).to.eql('function')
    expect(typeof sender.sendPixel).to.eql('function')
  })

  it('defaults to production if none set when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?tna=spec.*&dtstmp=\d+/)
      done()
    }
    const sender = new PixelSender({}, calls, successCallback)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request to a custom collector url when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?tna=spec.*&dtstmp=\d+/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, successCallback)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls bakers when sendAjax', function (done) {
    pixelStub.restore()
    let bakersCount = 0
    pixelStub = sandbox.stub(calls, 'pixelGet').callsFake((uri) => {
      bakersCount++
      if (bakersCount === 1) {
        expect(uri).to.match(/https:\/\/baker1.com\/baker\?dtstmp=\d+/)
      }
      if (bakersCount === 2) {
        expect(uri).to.match(/https:\/\/baker2.com\/baker\?dtstmp=\d+/)
        done()
      }
    })

    const sender = new PixelSender({}, calls)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{ "bakers": ["https://baker1.com/baker", "https://baker2.com/baker"]}')
  })

  it('calls emit an error when the pixel response is not a json when sendAjax', function (done) {
    bus.init()
    window[C.EVENT_BUS_NAMESPACE].on(C.ERRORS_PREFIX, (e) => {
      expect(e.name).to.eq('CallBakers')
      done()
    })

    const sender = new PixelSender({}, calls)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('succeeds after retry when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests).to.have.length(3)
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?.*atmp=1.*/)
      expect(ajaxRequests[1].url).to.match(/https:\/\/rp.liadm.com\/j\?.*atmp=2.*/)
      expect(ajaxRequests[2].url).to.match(/https:\/\/rp.liadm.com\/j\?.*atmp=3.*/)
      done()
    }
    const sender = new PixelSender({}, calls, successCallback)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(500, { 'Content-Type': 'application/json' })
    ajaxRequests[1].respond(500, { 'Content-Type': 'application/json' })
    ajaxRequests[2].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('retries 3 times when sendAjax', function (done) {
    bus.init()
    window[C.EVENT_BUS_NAMESPACE].on(C.ERRORS_PREFIX, (e) => {
      if (e.name === 'AjaxAttemptsExceeded') {
        expect(ajaxRequests).to.have.length(3)
        done()
      }
    })

    const sender = new PixelSender({}, calls)
    sender.sendAjax(stateStub())
    for (let i = 1; i <= 3; i++) {
      ajaxRequests[i - 1].respond(500, { 'Content-Type': 'application/json' })
    }
  })

  it('defaults to production if none set when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?tna=spec.*&dtstmp=\d+/)
      done()
    }
    const sender = new PixelSender({}, calls, successCallback)
    sender.sendAjax(stateStub())
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls a presend function when sendAjax', function (done) {
    const presend = () => {
      expect(ajaxRequests).to.be.empty
      done()
    }
    const sender = new PixelSender({}, calls, null, presend)
    sender.sendAjax(stateStub())
  })

  it('defaults to production if none set when sendPixel', function () {
    const sender = new PixelSender({}, calls)
    sender.sendPixel(stateStub())
    expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?tna=spec.*&dtstmp=\d+/)
    expect(pixelRequests[0].onload).to.be.undefined
  })

  it('sends an image pixel and call onload if request succeeds when sendPixel', function () {
    const onload = () => 1
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, onload)
    sender.sendPixel(stateStub())
    expect(pixelRequests[0].uri).to.match(/http:\/\/localhost\/p\?tna=spec.*&dtstmp=\d+/)
    expect(pixelRequests[0].onload).to.eql(onload)
  })

  it('does not send an image pixel if sendsPixel resolves to false when sendPixel', function () {
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, null)
    sender.sendPixel({ asQueryString: () => '?zzz=ccc', sendsPixel: () => false })
    expect(pixelRequests).to.be.empty
  })
})
