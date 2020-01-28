import { expect } from 'chai'
import jsdom from 'mocha-jsdom'
import * as emitter from '../../../src/utils/emitter'
import * as bus from '../../../src/events/bus'
import * as C from '../../../src/utils/consts'

describe('Emitter.error', () => {
  let windowBus = null
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  beforeEach(() => {
    bus.init()
    windowBus = window[C.EVENT_BUS_NAMESPACE]
  })

  it('should wrap an exception with name, message and stack trace', function () {
    const ex = []
    const reporter = (error) => ex.push(error)
    windowBus.on(C.ERRORS_PREFIX, reporter)
    emitter.error('some name', 'message', new Error('the original message'))
    expect(ex[0].name).to.eql('some name')
    expect(ex[0].message).to.eql('message')
    expect(ex[0].stack).to.have.string('the original message')
  })

  it('should report an exception if message has not been sent', function () {
    const ex = []
    const reporter = (error) => ex.push(error)
    windowBus.on(C.ERRORS_PREFIX, reporter)
    emitter.error('some name', null, new Error('the original message'))
    expect(ex[0].name).to.eql('some name')
    expect(ex[0].message).to.eql('the original message')
    expect(ex[0].stack).to.not.be.empty
  })

  it('should send a message in a correct namespace', function () {
    const messages = []
    const reporter = (error) => messages.push(error)
    windowBus.on(C.PIXEL_SENT_PREFIX, reporter)
    emitter.send(C.PIXEL_SENT_PREFIX, 'i am a message')
    expect(messages[0]).to.eql('i am a message')
  })

  it('should not report on an unknown message', function () {
    const messages = []
    const reporter = (error) => messages.push(error)
    windowBus.on(C.ERRORS_PREFIX, reporter)
    emitter.send(C.PIXEL_SENT_PREFIX, 'i am not going anywhere')
    expect(messages.length).to.eql(0)
  })
})
