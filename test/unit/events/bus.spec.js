import { expect } from 'chai'
import * as bus from '../../../src/events/bus'
import * as C from '../../../src/utils/consts'
import jsdom from 'mocha-jsdom'

describe('EventsBus in a window', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  it('should set up a bus on a global namespace according to constants', function () {
    const eventBus = bus.init()
    expect(eventBus.replaySize).to.eql(5)
    expect(window[C.EVENT_BUS_NAMESPACE]).to.not.eql(null)
    expect(window[C.EVENT_BUS_NAMESPACE].on).to.not.eql(null)
    expect(typeof window[C.EVENT_BUS_NAMESPACE].on).to.eql('function')
    expect(window[C.EVENT_BUS_NAMESPACE].emit).to.not.eql(null)
    expect(typeof window[C.EVENT_BUS_NAMESPACE].emit).to.eql('function')
  })

  it('should reuse the bus on a global namespace according to constants', function () {
    bus.init()
    const firstBus = window[C.EVENT_BUS_NAMESPACE]
    firstBus.on('a-dell', () => console.log('Hello, its me'))
    bus.init()
    const secondBus = window[C.EVENT_BUS_NAMESPACE]
    expect(firstBus).to.eql(secondBus)
  })

  it('should set the size correctly', function () {
    const eventBus = bus.init(3)
    expect(eventBus.replaySize).to.eq(3)
  })
})

describe('EventsBus with no window', () => {
  it('call the callback with an error', function () {
    let error = null
    const callback = (e) => {
      error = e
    }
    const eventBus = bus.init(1, callback)
    expect(eventBus).to.eql(undefined)
    expect(error).to.not.eql(null)
  })
})
