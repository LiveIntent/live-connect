import { expect, use } from 'chai'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { PixelSender } from '../../../src/pixel/sender'
import * as C from '../../../src/utils/consts'
import * as bus from '../../../src/events/bus'
import * as calls from '../../shared/utils/calls'
import { Query } from '../../../src/pixel/state'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

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
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({}, calls, successCallback)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request to a custom collector url when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, successCallback)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request with nc, nct and nb values when gdprApplies is true when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy&gdpr=1&nc=1&nct=1&nb=1/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, successCallback)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy'], ['gdpr', 1], ['nc', 1], ['nct', 1], ['nb', 1]]), sendsPixel: () => true })
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
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{ "bakers": ["https://baker1.com/baker", "https://baker2.com/baker"]}')
  })

  it('calls emit an error when the pixel response is not a json when sendAjax', function (done) {
    bus.init()
    window[C.EVENT_BUS_NAMESPACE].on(C.ERRORS_PREFIX, (e) => {
      expect(e.name).to.eq('CallBakers')
      done()
    })

    const sender = new PixelSender({}, calls)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('sends the event via pixel as fallback if ajax fails', function (done) {
    bus.init()
    const onload = () => 1
    window[C.EVENT_BUS_NAMESPACE].on(C.ERRORS_PREFIX, (e) => {
      expect(e.name).to.eq('AjaxFailed')
      expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
      expect(pixelRequests[0].onload).to.eql(onload)
      done()
    })

    const sender = new PixelSender({}, calls, onload)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(500, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('defaults to production if none set when sendAjax', function (done) {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({}, calls, successCallback)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls a presend function when sendAjax', function (done) {
    const presend = () => {
      expect(ajaxRequests).to.be.empty()
      done()
    }
    const sender = new PixelSender({}, calls, null, presend)
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
  })

  it('defaults to production if none set when sendPixel', function () {
    const sender = new PixelSender({}, calls)
    sender.sendPixel({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.be.undefined()
  })

  it('sends an image pixel and call onload if request succeeds when sendPixel', function () {
    const onload = () => 1
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, onload)
    sender.sendPixel({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    expect(pixelRequests[0].uri).to.match(/http:\/\/localhost\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.eql(onload)
  })

  it('does not send an image pixel if sendsPixel resolves to false when sendPixel', function () {
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, null)
    sender.sendPixel({ asQuery: () => new Query([['zzz', 'ccc']]), sendsPixel: () => false })
    expect(pixelRequests).to.be.empty()
  })
})
