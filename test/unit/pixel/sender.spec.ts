// @ts-nocheck

import { expect, use } from 'chai'
import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { PixelSender } from '../../../src/pixel/sender'
import { ERRORS_CHANNEL } from 'live-connect-common'
import { DefaultCallHandler } from 'live-connect-handlers'
import { Query } from '../../../src/pixel/state'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { WrappedCallHandler } from '../../../src/handlers/call-handler'

use(dirtyChai)

describe('PixelSender', () => {
  let ajaxRequests = []
  let pixelRequests = []
  const sandbox = sinon.createSandbox()
  let eventBus
  let pixelStub
  let calls: CallHandler

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.example.com'
    })
    eventBus = LocalEventBus()
    calls = new WrappedCallHandler(new DefaultCallHandler(), eventBus)
    ajaxRequests = []
    pixelRequests = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = xhr => ajaxRequests.push(xhr)
    pixelStub = sandbox.stub(calls, 'pixelGet').callsFake(
      (uri, onload) => {
        pixelRequests.push({
          uri,
          onload
        })
      }
    )
  })

  afterEach(() => {
    pixelStub.restore()
  })

  it('exposes the send and sendPixel functions', () => {
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, calls, null)
    expect(typeof sender.sendAjax).to.eql('function')
    expect(typeof sender.sendPixel).to.eql('function')
  })

  it('defaults to production if none set when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request to a custom collector url when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request with n3pc, n3pct and nb values when gdprApplies is true when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy&gdpr=1&n3pc=1&n3pct=1&nb=1/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy'], ['gdpr', 1], ['n3pc', 1], ['n3pct', 1], ['nb', 1]]), sendsPixel: () => true }, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls bakers when sendAjax', (done) => {
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

    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{ "bakers": ["https://baker1.com/baker", "https://baker2.com/baker"]}')
  })

  it('calls emit an error when the pixel response is not a json when sendAjax', (done) => {
    eventBus.on(ERRORS_CHANNEL, (e) => {
      expect(e.name).to.eq('CallBakers')
      done()
    })

    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('sends the event via pixel as fallback if ajax fails', (done) => {
    const onload = () => 1
    eventBus.on(ERRORS_CHANNEL, (e) => {
      expect(e.name).to.eq('AjaxFailed')
      expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
      expect(pixelRequests[0].onload).to.eql(onload)
      done()
    })

    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onLoad: onload })
    ajaxRequests[0].respond(500, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('defaults to production if none set when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp.liadm.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls a presend function when sendAjax', (done) => {
    const presend = () => {
      expect(ajaxRequests).to.be.empty()
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onPreSend: presend })
  })

  it('defaults to production if none set when sendPixel', () => {
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendPixel({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true })
    expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.be.undefined()
  })

  it('sends an image pixel and call onload if request succeeds when sendPixel', () => {
    const onload = () => 1
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendPixel({ asQuery: () => new Query([['xxx', 'yyy']]), sendsPixel: () => true }, { onLoad: onload })
    expect(pixelRequests[0].uri).to.match(/http:\/\/localhost\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.eql(onload)
  })

  it('does not send an image pixel if sendsPixel resolves to false when sendPixel', () => {
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendPixel({ asQuery: () => new Query([['zzz', 'ccc']]), sendsPixel: () => false })
    expect(pixelRequests).to.be.empty()
  })
})
