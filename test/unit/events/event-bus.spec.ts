import { expect, use } from 'chai'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { GlobalEventBus, getAvailableBus, LocalEventBus } from '../../../src/events/event-bus.js'
import * as C from '../../../src/utils/consts.js'

use(dirtyChai)

describe('EventsBus in a window', () => {
  let cleanup: () => void = () => 0
  beforeEach(() => {
    cleanup = jsdom('', {
      url: 'http://www.example.com'
    })
  })

  afterEach(() => cleanup())

  it('should set up a bus under the given variable name', () => {
    const name = 'testBus'
    // @ts-expect-error
    GlobalEventBus(name)
    // @ts-expect-error
    expect(window[name].data.size).to.eql(5)
    expect(window[name]).to.not.eql(null)
    // @ts-expect-error
    expect(window[name].on).to.not.eql(null)
    // @ts-expect-error
    expect(typeof window[name].on).to.eql('function')
    // @ts-expect-error
    expect(window[name].emit).to.not.eql(null)
    // @ts-expect-error
    expect(typeof window[name].emit).to.eql('function')
  })

  it('should reuse the bus on a given namespace', () => {
    const name = 'testBus'
    // @ts-expect-error
    const firstBus = GlobalEventBus(name)
    // @ts-expect-error
    const secondBus = GlobalEventBus(name)
    expect(firstBus).to.eql(secondBus)
  })

  it('should set the size correctly', () => {
    const name = 'testBus'
    // @ts-expect-error
    GlobalEventBus(name, 3)
    // @ts-expect-error
    expect(window[name].data.size).to.eq(3)
  })

  it('should extend the bus with the new interface if needed', () => {
    const name = 'testBus'
    window[name] = {}
    // @ts-expect-error
    GlobalEventBus(name)
    expect(window[name]).to.not.eql(null)
    // @ts-expect-error
    expect(window[name].emitErrorWithMessage).to.not.eql(null)
    // @ts-expect-error
    expect(window[name].emitErrorWithMessage).to.not.eql(undefined)
    // @ts-expect-error
    expect(typeof window[name].emitErrorWithMessage).to.eql('function')
    // @ts-expect-error
    expect(window[name].emitError).to.not.eql(null)
    // @ts-expect-error
    expect(window[name].emitError).to.not.eql(undefined)
    // @ts-expect-error
    expect(typeof window[name].emitError).to.eql('function')
  })

  it('should retrieve global bus if the instance bus missing', () => {
    const globalVarName = 'testName'
    window[globalVarName] = {}
    window[C.EVENT_BUS_NAMESPACE] = LocalEventBus()
    // @ts-expect-error
    expect(window[globalVarName].eventBus).to.eql(undefined)
    const retrievedBus = getAvailableBus(globalVarName)
    expect(retrievedBus).to.eql(window[C.EVENT_BUS_NAMESPACE])
  })
})

describe('EventsBus with no window', () => {
  it('call the callback with an error', () => {
    let error = null
    // @ts-expect-error
    const callback = e => {
      error = e
    }
    const eventBus = GlobalEventBus('testBus', 1, callback)
    expect(eventBus).to.eql(undefined)
    expect(error).to.not.eql(null)
  })
})
