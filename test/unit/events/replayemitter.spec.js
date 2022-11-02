import { expect, spy, use } from 'chai'
import chaiSpies from 'chai-spies'
import { E as ReplayEmitter, wrapError } from '../../../src/events/replayemitter'
import * as C from '../../../src/utils/consts'

use(chaiSpies)

describe('ReplayEmitter', () => {
  it('should replay all stored events to a handler and coninue handling when it is attached using `on`', () => {
    const emitter = new ReplayEmitter(5)
    emitter.emit('test', 'first event')
    emitter.emit('other topic', 'other event')
    const callback = spy()

    emitter.on('test', callback)

    expect(callback).to.have.been.first.called.with.exactly('first event')

    emitter.emit('test', 'second event')
    expect(callback).have.been.second.called.with.exactly('second event')
  })

  it('should replay the oldest stored event to a handler and decease when it is attached using `once`', () => {
    const emitter = new ReplayEmitter(5)
    emitter.emit('other topic', 'other event')
    emitter.emit('test', 'first event')
    const callback = spy()

    emitter.once('test', callback)

    expect(callback).to.have.been.first.called.with.exactly('first event')

    emitter.emit('test', 'second event')
    expect(callback).to.have.been.called.once()
  })

  it('should work fine when attached with no previous events', () => {
    const emitter = new ReplayEmitter(5)
    const callbackOn = spy()
    const callbackOnce = spy()
    emitter.on('test', callbackOn)
    emitter.once('test', callbackOnce)
    expect(callbackOn).to.not.have.been.called()
    expect(callbackOnce).to.not.have.been.called()

    emitter.emit('test', 'first event')
    expect(callbackOn).to.have.been.first.called.with.exactly('first event')
    expect(callbackOnce).to.have.been.once.called.with.exactly('first event')

    emitter.emit('test', 'second event')
    expect(callbackOn).to.have.been.second.called.with.exactly('second event')
    expect(callbackOnce).to.have.been.called.once()
  })

  it('should drop oldest messages on overflow', () => {
    const queueSize = 5
    const totalMessages = 19
    const emitter = new ReplayEmitter(queueSize)
    const callback = spy()

    for (var i = 0; i < totalMessages; i++) {
      emitter.emit('test', `event ${i}`)
    }

    emitter.on('test', callback)

    for (var j = 0; j < queueSize; j++) {
      expect(callback).on.nth(j + 1).be.called.with(`event ${totalMessages - queueSize + j}`)
    }
  })

  it('should handle misconfiguration and set default queue size', () => {
    const emitter = new ReplayEmitter('not int')

    expect(emitter.size).to.be.eq(5)
  })

  it('should properly turn off handlers with callbacks passed', () => {
    const emitter = new ReplayEmitter(5)

    const callback1 = spy()
    const callback2 = spy()

    emitter.on('test', callback1)
    emitter.on('test', callback2)

    expect(emitter.h.test.length).to.be.eq(2)

    emitter.off('test', callback1)
    expect(emitter.h.test.length).to.be.eq(1)

    emitter.off('test', callback2)
    expect(emitter.h.test).to.be.undefined()
  })

  it('should turn off all handlers when no callback passed', () => {
    const emitter = new ReplayEmitter(5)

    const callback1 = spy()
    const callback2 = spy()

    emitter.on('test', callback1)
    emitter.on('test', callback2)

    expect(emitter.h.test.length).to.be.eq(2)

    emitter.off('test')
    expect(emitter.h.test).to.be.undefined()
  })

  it('should wrap an exception with name, message and stack trace', () => {
    const wrappedError = wrapError('some name', 'message', new Error('the original message'))
    expect(wrappedError.name).to.eql('some name')
    expect(wrappedError.message).to.eql('message')
    expect(wrappedError.stack).to.have.string('the original message')
  })

  it('should use exception message if message has not been sent', () => {
    const wrappedError = wrapError('some name', null, new Error('the original message'))
    expect(wrappedError.name).to.eql('some name')
    expect(wrappedError.message).to.eql('the original message')
    expect(wrappedError.stack).to.have.string('the original message')
  })

  it('should emit error with message to error namespace', () => {
    const emitter = new ReplayEmitter(5)
    const ex = []
    const reporter = (error) => ex.push(error)
    emitter.on(C.ERRORS_PREFIX, reporter)
    emitter.emitErrorWithMessage('some name', 'message', new Error('the original message'))
    expect(ex[0].name).to.eql('some name')
    expect(ex[0].message).to.eql('message')
    expect(ex[0].stack).to.have.string('the original message')
  })

  it('should emit error using the message in the exception', () => {
    const emitter = new ReplayEmitter(5)
    const ex = []
    const reporter = (error) => ex.push(error)
    emitter.on(C.ERRORS_PREFIX, reporter)
    emitter.emitError('some name', new Error('the original message'))
    expect(ex[0].name).to.eql('some name')
    expect(ex[0].message).to.eql('the original message')
    expect(ex[0].stack).to.have.string('the original message')
  })

  it('should not emit error on an different namespace', () => {
    const emitter = new ReplayEmitter(5)
    const messages = []
    const reporter = (error) => messages.push(error)
    emitter.on(C.PIXEL_SENT_PREFIX, reporter)
    emitter.emitError('some name', new Error('the original message'))
    expect(messages.length).to.eql(0)
  })
})
