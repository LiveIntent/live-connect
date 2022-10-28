import jsdom from 'mocha-jsdom'
import { expect, use } from 'chai'
import sinon from 'sinon'
import { CallHandler } from '../../../src/handlers/call-handler'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus'

use(dirtyChai)

describe('CallHandler', () => {
  let emitterErrors = []
  let eventBusStub
  const eventBus = LocalEventBus()
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    emitterErrors = []
    eventBusStub = sandbox.stub(eventBus, 'emitErrorWithMessage').callsFake((name, message, e) => {
      emitterErrors.push({
        name: name,
        message: message,
        exception: e
      })
    })
  })

  afterEach(() => {
    eventBusStub.restore()
  })

  it('should return the get function', function () {
    const ajaxGet = () => undefined
    const pixelGet = () => undefined
    const handler = CallHandler({ ajaxGet: ajaxGet, pixelGet: pixelGet })

    expect(handler).to.be.eql({ ajaxGet: ajaxGet, pixelGet: pixelGet })
  })

  it('should send an error if an external handler is not provided', function () {
    CallHandler({}, eventBus)
    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The call functions \'["ajaxGet","pixelGet"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler does not have a get function', function () {
    CallHandler({}, eventBus)

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The call functions \'["ajaxGet","pixelGet"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })
})
