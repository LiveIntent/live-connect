import jsdom from 'mocha-jsdom'
import { expect, use } from 'chai'
import sinon from 'sinon'
import * as emitter from '../../../src/utils/emitter'
import { CallHandler } from '../../../src/handlers/call-handler'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('CallHandler', () => {
  let emitterErrors = []
  let emitterStub
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    emitterErrors = []
    emitterStub = sandbox.stub(emitter, 'error').callsFake((name, message, e) => {
      emitterErrors.push({
        name: name,
        message: message,
        exception: e
      })
    })
  })

  afterEach(() => {
    emitterStub.restore()
  })

  it('should return the get function', function () {
    const ajaxGet = () => undefined
    const pixelGet = () => undefined
    const handler = CallHandler({ ajaxGet: ajaxGet, pixelGet: pixelGet })

    expect(handler).to.be.eql({ ajaxGet: ajaxGet, pixelGet: pixelGet })
  })

  it('should send an error if an external handler is not provided', function () {
    CallHandler()

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The call functions \'["ajaxGet","pixelGet"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler does not have a get function', function () {
    CallHandler({})

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('CallHandler')
    expect(emitterErrors[0].message).to.be.eq('The call functions \'["ajaxGet","pixelGet"]\' are not provided')
    expect(emitterErrors[0].exception).to.be.undefined()
  })
})
