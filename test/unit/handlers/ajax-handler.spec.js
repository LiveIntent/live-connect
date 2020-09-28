import jsdom from 'mocha-jsdom'
import { expect } from 'chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'
import * as storage from '../../shared/utils/storage'
import sinon from 'sinon'
import * as emitter from '../../../src/utils/emitter'
import { AjaxHandler } from '../../../src/handlers/ajax-handler'

describe('AjaxHandler', () => {
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
    const getFunction = () => undefined
    const handler = AjaxHandler({ get: getFunction })

    expect(handler).to.be.eql({ get: getFunction })
  })

  it('should send an error if an external handler is not provided', function () {
    AjaxHandler()

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('AjaxHandler')
    expect(emitterErrors[0].message).to.be.eq('The ajax function \'get\' is not provided')
    expect(emitterErrors[0].exception).to.be.undefined
  })

  it('should send an error if an external handler doesn not have a get function', function () {
    AjaxHandler({})

    expect(emitterErrors.length).to.be.eq(1)
    expect(emitterErrors[0].name).to.be.eq('AjaxHandler')
    expect(emitterErrors[0].message).to.be.eq('The ajax function \'get\' is not provided')
    expect(emitterErrors[0].exception).to.be.undefined
  })
})
