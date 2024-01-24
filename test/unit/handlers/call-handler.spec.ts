import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import sinon, { SinonStub } from 'sinon'
import { WrappedCallHandler } from '../../../src/handlers/call-handler'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'
import { CallHandler, EventBus } from 'live-connect-common'

use(dirtyChai)

type RecordedError = { 'name': string; 'message': string; 'exception': unknown }

describe('CallHandler', () => {
  let emitterErrors: RecordedError[] = []
  let eventBusStub: SinonStub<[string, string, unknown?], EventBus>

  const eventBus = LocalEventBus()
  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.something.example.com'
    })
    emitterErrors = []
    eventBusStub = sandbox.stub(eventBus, 'emitErrorWithMessage').callsFake((name, message, e) => {
      emitterErrors.push({
        name,
        message,
        exception: e
      })
      return eventBus
    })
  })

  afterEach(() => {
    eventBusStub.restore()
  })

  it('should return the get function', () => {
    const eventBus = LocalEventBus()
    let ajaxCounter = 0
    let pixelCounter = 0

    const ajaxGet = () => { ajaxCounter += 1 }
    const pixelGet = () => { pixelCounter += 1 }
    const handler = new WrappedCallHandler({ ajaxGet, pixelGet }, eventBus, false)

    handler.ajaxGet('foo', () => undefined)
    expect(ajaxCounter).to.be.eql(1)
    expect(pixelCounter).to.be.eql(0)

    handler.pixelGet('foo', () => undefined)
    expect(ajaxCounter).to.be.eql(1)
    expect(pixelCounter).to.be.eql(1)
  })

  it('should send an error if an external handler is not provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new WrappedCallHandler({}, eventBus, false)
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The functions \'["ajaxGet","pixelGet"]\' were not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler does not have a get function', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new WrappedCallHandler({}, eventBus, false)

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The functions \'["ajaxGet","pixelGet"]\' were not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should not do anything when in privacy mode', (done) => {
    let requestMade = false
    let callBackCalled = false

    const underlying: CallHandler = {
      ajaxGet: () => { requestMade = true },
      pixelGet: () => { requestMade = true }
    }

    const handler = new WrappedCallHandler(underlying, eventBus, true)
    handler.ajaxGet('', () => { callBackCalled = true }, () => { callBackCalled = true })
    handler.pixelGet('', () => { callBackCalled = true })

    setTimeout(() => {
      expect(callBackCalled).to.be.false()
      expect(requestMade).to.be.false()
      done()
    }, 200)
  })
})
