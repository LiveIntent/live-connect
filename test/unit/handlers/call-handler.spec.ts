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
    const eventBus = LocalEventBus()
    let ajaxCounter = 0
    let pixelCounter = 0

    const ajaxGet = () => { ajaxCounter += 1 }
    const pixelGet = () => { pixelCounter += 1 }
    const handler = CallHandler({ ajaxGet: ajaxGet, pixelGet: pixelGet }, eventBus)

    handler.ajaxGet('foo', () => undefined)
    expect(ajaxCounter).to.be.eql(1)
    expect(pixelCounter).to.be.eql(0)

    handler.pixelGet('foo', () => undefined)
    expect(ajaxCounter).to.be.eql(1)
    expect(pixelCounter).to.be.eql(1)
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
