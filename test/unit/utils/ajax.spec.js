import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect } from 'chai'
import { get } from '../../../src/utils/ajax'
import * as emitter from '../../../src/utils/emitter'

describe('Ajax', () => {
  let requests = []
  let emitterErrors = []
  const dummy = () => {}
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  beforeEach(() => {
    requests = []
    emitterErrors = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = function (xhr) {
      requests.push(xhr)
    }
  })

  it('GET : invokes the success callback', function (done) {
    const successCallback = (body, request) => {
      expect(body).to.eql('{"comment": "Howdy"}')
      expect(request).to.eql(requests[0])
      done()
    }
    get('http://steve.liadm.com/idex/any/any', successCallback)
    const request = requests[0]
    request.respond(200, { 'Content-Type': 'application/json' }, '{"comment": "Howdy"}')
  })

  it('GET : invokes the fallback callback for failure status codes', function (done) {
    const emitterStub = sandbox.stub(emitter, 'error').callsFake((name, message, e) => {
      emitterErrors.push({
        name: name,
        message: message,
        exception: e
      })
    })
    const fallback = () => {
      expect(request).to.eql(requests[0])
      expect(emitterErrors).to.not.be.empty
      const emitterError = emitterErrors[0]
      expect(emitterError.message).to.eql('Error during XHR call: 503, url: http://steve.liadm.com/idex/any/any')
      expect(emitterError.name).to.eql('XHRError')
      emitterStub.restore()
      done()
    }
    get('http://steve.liadm.com/idex/any/any', dummy, fallback)
    const request = requests[0]
    request.respond(503, null, '')
  })

  it('GET : invokes the fallback callback on failure', function (done) {
    global.XMLHttpRequest = () => {
      throw new Error('Purposely failing')
    }
    const emitterStub = sandbox.stub(emitter, 'error').callsFake((name, message, e) => {
      emitterErrors.push({
        name: name,
        message: message,
        exception: e
      })
    })
    const fallback = () => {
      emitterStub.restore()
      done()
    }
    get('http://steve.liadm.com/idex/any/any', dummy, fallback)
  })
})
