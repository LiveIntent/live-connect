import { expect, use } from 'chai'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import * as errorPixel from '../../../src/events/error-pixel'
import * as pixelSender from '../../../src/pixel/sender'
import { LocalEventBus } from '../../../src/events/event-bus'
import { ERRORS_CHANNEL } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { EventBus } from '../../../src/types'

use(dirtyChai)

describe('ErrorPixel', () => {
  const sandbox = sinon.createSandbox()
  let eventBus: EventBus
  let errors: string[]
  const stub = sandbox.stub(pixelSender, 'PixelSender').returns({
    sendPixel: (data) => errors.push(data),
    mock: true
  })
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  beforeEach(() => {
    errors = []
    eventBus = LocalEventBus()
  })

  after(() => {
    stub.restore()
  })

  it('should register itself on the global bus', function () {
    errorPixel.register({ collectorUrl: 'http://localhost' }, {}, eventBus)
    const errorHandler = eventBus.h
    expect(errorHandler).to.have.key(ERRORS_CHANNEL)
    expect(errorHandler[ERRORS_CHANNEL].length).to.be.eql(1)
  })

  it('should call the pixel once registered', function () {
    errorPixel.register({ collectorUrl: 'http://localhost' }, {}, eventBus)
    eventBus.emitErrorWithMessage('Error', 'some other message')
    expect(errors.length).to.eql(1)
    const errorDetails = errors[0].data.errorDetails
    expect(errorDetails.message).to.eql('some other message')
    expect(errorDetails.name).to.eql('Error')
    expect(errors[0].data.pageUrl).to.equal('http://www.example.com/?sad=0&dsad=iou')
    expect(errors[0].data.collectorUrl).to.eql('http://localhost')
  })

  it('should truncate the excessive text', function () {
    const longText = 'x'.repeat(200)
    const error = new Error(longText)
    const result = errorPixel.asErrorDetails(error)
    expect(result.errorDetails.message.length).to.eq(123)
  })

  it('should send the default error if none was sent', function () {
    const result = errorPixel.asErrorDetails(null)
    expect(result).to.deep.equal({
      errorDetails: {
        message: 'Unknown message',
        name: 'Unknown name'
      }
    })
  })
})
