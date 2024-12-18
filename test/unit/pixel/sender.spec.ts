import { expect, use } from 'chai'
import jsdom from 'global-jsdom'
import sinon, { SinonFakeXMLHttpRequest, SinonStub } from 'sinon'
import { PixelSender } from '../../../src/pixel/sender.js'
import { ERRORS_CHANNEL, ErrorDetails, EventBus } from 'live-connect-common'
import { DefaultCallHandler } from 'live-connect-handlers'
import { StateWrapper } from '../../../src/pixel/state.js'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus.js'
import { WrappedCallHandler } from '../../../src/handlers/call-handler.js'
import { QueryBuilder } from '../../../src/internal.js'

use(dirtyChai)

describe('PixelSender', () => {
  let ajaxRequests: SinonFakeXMLHttpRequest[] = []
  let pixelRequests: { uri: string, onload?: () => void }[] = []
  const sandbox = sinon.createSandbox()
  let eventBus: EventBus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pixelStub: SinonStub<any[], any>
  let calls: WrappedCallHandler
  // let privacy:

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.example.com'
    })
    eventBus = LocalEventBus()
    calls = new WrappedCallHandler(new DefaultCallHandler(), eventBus, false)
    ajaxRequests = []
    pixelRequests = []
    // @ts-ignore
    global.XDomainRequest = null
    // @ts-ignore
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    // @ts-ignore
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

  const stubbedStateWrapper: StateWrapper = {
    data: {},
    asQuery: () => new QueryBuilder([['xxx', 'yyy']]),
    sendsPixel: () => true,
    asHeaders: () => ({}),
    setHashedEmail: () => {},
    getHashedEmail: () => []
  }

  it('exposes the send and sendPixel functions', () => {
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    expect(typeof sender.sendAjax).to.eql('function')
    expect(typeof sender.sendPixel).to.eql('function')
  })

  it('defaults to production if none set when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp\.liadm\.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request to a custom collector url when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('sends a request when gdprApplies is true when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/http:\/\/localhost\/j\?dtstmp=\d+&xxx=yyy&gdpr=1/)
      done()
    }
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    const stubbedStateWrapper1: StateWrapper = {
      data: stubbedStateWrapper.data,
      asQuery: () => new QueryBuilder([['xxx', 'yyy'], ['gdpr', '1']]),
      sendsPixel: stubbedStateWrapper.sendsPixel,
      asHeaders: stubbedStateWrapper.asHeaders,
      setHashedEmail: stubbedStateWrapper.setHashedEmail,
      getHashedEmail: stubbedStateWrapper.getHashedEmail
    }

    sender.sendAjax(stubbedStateWrapper1, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls bakers when sendAjax', (done) => {
    pixelStub.restore()
    let bakersCount = 0
    pixelStub = sandbox.stub(calls, 'pixelGet').callsFake((uri) => {
      bakersCount++
      if (bakersCount === 1) {
        expect(uri).to.match(/https:\/\/baker1\.com\/baker\?dtstmp=\d+/)
      }
      if (bakersCount === 2) {
        expect(uri).to.match(/https:\/\/baker2\.com\/baker\?dtstmp=\d+/)
        done()
      }
    })

    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper)
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{ "bakers": ["https://baker1.com/baker", "https://baker2.com/baker"]}')
  })

  it('calls emit an error when the pixel response is not a json when sendAjax', (done) => {
    eventBus.on(ERRORS_CHANNEL, (e) => {
      expect((e as ErrorDetails).name).to.eq('CallBakers')
      done()
    })

    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper)
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('sends the event via pixel as fallback if ajax fails', (done) => {
    const onload = () => 1
    eventBus.on(ERRORS_CHANNEL, (e) => {
      expect((e as ErrorDetails).name).to.eq('AjaxFailed')
      expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
      expect(pixelRequests[0].onload).to.eql(onload)
      done()
    })

    const sender = new PixelSender({ callHandler: calls, eventBus, ajaxRetries: 0 })
    sender.sendAjax(stubbedStateWrapper, { onLoad: onload })
    ajaxRequests[0].respond(500, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('retries ajax requests when they fail', (done) => {
    const onload = () => 1
    eventBus.on(ERRORS_CHANNEL, (e) => {
      expect((e as ErrorDetails).name).to.eq('AjaxFailed')
      expect(pixelRequests[0].uri).to.match(/https:\/\/rp.liadm.com\/p\?dtstmp=\d+&xxx=yyy/)
      expect(pixelRequests[0].onload).to.eql(onload)
      done()
    })

    const sender = new PixelSender({ callHandler: calls, eventBus, ajaxRetries: 1 })
    sender.sendAjax(stubbedStateWrapper, { onLoad: onload })
    ajaxRequests[0].respond(500, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
    ajaxRequests[1].respond(500, { 'Content-Type': 'application/json' }, '{kaiserschmarrn}')
  })

  it('defaults to production if none set when sendAjax', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp\.liadm\.com\/j\?dtstmp=\d+&xxx=yyy/)
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })

  it('calls a presend function when sendAjax', (done) => {
    const presend = () => {
      expect(ajaxRequests).to.be.empty()
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendAjax(stubbedStateWrapper, { onPreSend: presend })
  })

  it('defaults to production if none set when sendPixel', () => {
    const sender = new PixelSender({ callHandler: calls, eventBus })
    sender.sendPixel(stubbedStateWrapper)
    expect(pixelRequests[0].uri).to.match(/https:\/\/rp\.liadm\.com\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.be.undefined()
  })

  it('sends an image pixel and call onload if request succeeds when sendPixel', () => {
    const onload = () => 1
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })
    sender.sendPixel(stubbedStateWrapper, { onLoad: onload })
    expect(pixelRequests[0].uri).to.match(/http:\/\/localhost\/p\?dtstmp=\d+&xxx=yyy/)
    expect(pixelRequests[0].onload).to.eql(onload)
  })

  it('does not send an image pixel if sendsPixel resolves to false when sendPixel', () => {
    const sender = new PixelSender({ collectorUrl: 'http://localhost', callHandler: calls, eventBus })

    const stubbedStateWrapper1: StateWrapper = {
      data: stubbedStateWrapper.data,
      asQuery: () => new QueryBuilder([['zzz', 'ccc']]),
      sendsPixel: () => false,
      asHeaders: stubbedStateWrapper.asHeaders,
      setHashedEmail: stubbedStateWrapper.setHashedEmail,
      getHashedEmail: stubbedStateWrapper.getHashedEmail
    }
    sender.sendPixel(stubbedStateWrapper1)
    expect(pixelRequests).to.be.empty()
  })

  it('sends headers', (done) => {
    const successCallback = () => {
      expect(ajaxRequests[0].url).to.match(/https:\/\/rp\.liadm\.com\/j\?dtstmp=\d+&xxx=yyy/)
      expect(ajaxRequests[0].requestHeaders['X-LI-Provided-User-Agent']).to.eql('Mozilla/5.0')
      done()
    }
    const sender = new PixelSender({ callHandler: calls, eventBus })
    const stubbedStateWrapper1: StateWrapper = {
      data: stubbedStateWrapper.data,
      asQuery: stubbedStateWrapper.asQuery,
      sendsPixel: stubbedStateWrapper.sendsPixel,
      asHeaders: () => ({ 'X-LI-Provided-User-Agent': 'Mozilla/5.0' }),
      setHashedEmail: stubbedStateWrapper.setHashedEmail,
      getHashedEmail: stubbedStateWrapper.getHashedEmail
    }
    sender.sendAjax(stubbedStateWrapper1, { onLoad: successCallback })
    ajaxRequests[0].respond(200, { 'Content-Type': 'application/json' }, '{}')
  })
})
