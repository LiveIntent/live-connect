import { expect } from 'chai'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import * as errorPixel from '../../../src/events/error-pixel'
import * as pixelSender from '../../../src/pixel/sender'
import * as bus from '../../../src/events/bus'
import * as C from '../../../src/utils/consts'

describe('ErrorPixel', () => {
  const sandbox = sinon.createSandbox()
  let windowBus = null
  let errors = []
  const stub = sandbox.stub(pixelSender, 'PixelSender').returns({
    send: (data) => errors.push(data),
    mock: true
  })
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  beforeEach(() => {
    errors = []
    bus.init()
    windowBus = window[C.EVENT_BUS_NAMESPACE]
  })

  after(() => {
    stub.restore()
  })

  it('should register itself on the global bus', function () {
    errorPixel.register({ collectorUrl: 'http://localhost' })
    const errorHandler = windowBus.handlers
    expect(errorHandler).to.have.key(C.ERRORS_PREFIX)
    expect(errorHandler[C.ERRORS_PREFIX].length).to.be.eql(1)
    expect(errorHandler[C.ERRORS_PREFIX][0].fn.name).to.eql('_pixelError')
  })

  it('should call the pixel once registered', function () {
    errorPixel.register({ collectorUrl: 'http://localhost' })
    windowBus.emit(C.ERRORS_PREFIX, new Error('some other message'))
    expect(errors.length).to.eql(1)
    const errorDetails = errors[0].data.errorDetails
    expect(errorDetails.message).to.eql('some other message')
    expect(errorDetails.name).to.eql('Error')
    expect(errors[0].data.pageUrl).to.equal('http://www.example.com/?sad=0&dsad=iou')
    expect(errors[0].data.collectorUrl).to.eql('http://localhost')
  })

  it('should truncate the excessive text', function () {
    const longText = 'x'.repeat(200)
    const error =  new Error(longText)
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
