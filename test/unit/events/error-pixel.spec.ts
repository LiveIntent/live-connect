import { expect, use } from 'chai'
import jsdom from 'global-jsdom'
import sinon from 'sinon'
import * as errorPixel from '../../../src/events/error-pixel'
import { PixelSender } from '../../../src/pixel/sender'
import { LocalEventBus } from '../../../src/events/event-bus'
import { ERRORS_CHANNEL, EventBus } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { WrappedCallHandler } from '../../../src/handlers/call-handler'
import { StateWrapper } from '../../../src/pixel/state'

use(dirtyChai)

describe('ErrorPixel', () => {
  const sandbox = sinon.createSandbox()
  let eventBus: EventBus
  let errors: StateWrapper[]

  beforeEach(() => {
    jsdom('', {
      url: 'https://www.example.com'
    })
    errors = []
    eventBus = LocalEventBus()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should register itself on the global bus', () => {
    errorPixel.register({ collectorUrl: 'http://localhost' }, {} as WrappedCallHandler, eventBus)
    // @ts-expect-error
    const errorHandler = eventBus.data.h
    expect(errorHandler).to.have.key(ERRORS_CHANNEL)
    expect(errorHandler[ERRORS_CHANNEL].length).to.be.eql(1)
  })

  it('should call the pixel once registered', () => {
    sandbox.stub(PixelSender.prototype, 'sendPixel').callsFake((data: StateWrapper) => errors.push(data))

    errorPixel.register({ collectorUrl: 'http://localhost' }, {} as WrappedCallHandler, eventBus)
    eventBus.emitErrorWithMessage('Error', 'some other message')
    expect(errors.length).to.eql(1)
    const errorDetails = errors[0].data.errorDetails
    console.log(errors[0].data)
    // @ts-expect-error
    expect(errorDetails.message).to.eql('some other message')
    // @ts-expect-error
    expect(errorDetails.name).to.eql('Error')
    expect(errors[0].data.collectorUrl).to.eql('http://localhost')
    expect(errors[0].data.pageUrl).to.equal('https://www.example.com/?sad=0&dsad=iou')
  })

  it('should truncate the excessive text', () => {
    const longText = 'x'.repeat(200)
    const error = new Error(longText)
    const result = errorPixel.asErrorDetails(error)
    // @ts-expect-error
    expect(result.errorDetails.message.length).to.eq(123)
  })

  it('should send the default error if none was sent', () => {
    const result = errorPixel.asErrorDetails(null)
    expect(result).to.deep.equal({
      errorDetails: {
        message: 'Unknown message',
        name: 'Unknown name'
      }
    })
  })
})
