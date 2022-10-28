import { expect, use } from 'chai'
import jsdom from 'mocha-jsdom'
import dirtyChai from 'dirty-chai'
import { GlobalEventBus, getAndAttachGlobalBus, LocalEventBus } from '../../../src/events/event-bus'
import * as C from '../../../src/utils/consts'

use(dirtyChai)

describe('EventsBus in a window', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  it('should set up a bus under the given variable name', function () {
    const name = 'testBus'
    GlobalEventBus(name)
    expect(window[name].size).to.eql(5)
    expect(window[name]).to.not.eql(null)
    expect(window[name].on).to.not.eql(null)
    expect(typeof window[name].on).to.eql('function')
    expect(window[name].emit).to.not.eql(null)
    expect(typeof window[name].emit).to.eql('function')
  })

  it('should reuse the bus on a given namespace', function () {
    const name = 'testBus'
    const firstBus = GlobalEventBus(name)
    firstBus.on('a-dell', () => console.log('Hello, its me'))
    const secondBus = GlobalEventBus(name)
    expect(firstBus).to.eql(secondBus)
  })

  it('should set the size correctly', function () {
    const name = 'testBus'
    GlobalEventBus(name, 3)
    expect(window[name].size).to.eq(3)
  })

  it('should extend the bus with the new interface if needed', function () {
    const name = 'testBus'
    window[name] = {}
    GlobalEventBus(name)
    expect(window[name]).to.not.eql(null)
    expect(window[name].emitErrorWithMessage).to.not.eql(null)
    expect(window[name].emitErrorWithMessage).to.not.eql(undefined)
    expect(typeof window[name].emitErrorWithMessage).to.eql('function')
    expect(window[name].emitError).to.not.eql(null)
    expect(window[name].emitError).to.not.eql(undefined)
    expect(typeof window[name].emitError).to.eql('function')
  })

  it('should attach global bus to the LC instance if missing', function () {
    const globalVarName = 'testName'
    window[globalVarName] = {}
    window[C.EVENT_BUS_NAMESPACE] = LocalEventBus()
    expect(window[globalVarName].eventBus).to.eql(undefined)
    getAndAttachGlobalBus(globalVarName)
    expect(window[globalVarName].eventBus).to.not.eql(null)
    expect(window[globalVarName].eventBus).to.eql(window[C.EVENT_BUS_NAMESPACE])
  })
})

describe('EventsBus with no window', () => {
  it('call the callback with an error', function () {
    let error = null
    const callback = (e) => {
      error = e
    }
    const eventBus = GlobalEventBus('testBus', 1, callback)
    expect(eventBus).to.eql(undefined)
    expect(error).to.not.eql(null)
  })
})
