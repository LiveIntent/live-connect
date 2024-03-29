// @ts-nocheck

import jsdom from 'global-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { MinimalLiveConnect, LiveConnect } from '../../src/index.js'
import { DefaultStorageHandler, DefaultCallHandler } from 'live-connect-handlers'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../src/events/event-bus.js'

use(dirtyChai)

describe('MinimalLiveConnect', () => {
  const sandbox = sinon.createSandbox()
  const bus = LocalEventBus()
  const storage = new DefaultStorageHandler(bus)
  const calls = new DefaultCallHandler()

  let imgStub = null
  let pixelCalls = []
  let errorCalls = []

  afterEach(() => {
    imgStub.restore()
  })

  beforeEach(() => {
    jsdom('', {
      url: 'https://www.example.com/?sad=0&dsad=iou'
    })

    pixelCalls = []
    errorCalls = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = xhr => pixelCalls.push(xhr)
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').callsFake(() => {
      const obj = { onload }
      errorCalls.push(obj)
      return obj
    })
  })

  it('should expose liQ and liQ_instances', () => {
    expect(window.liQ).to.be.undefined()
    expect(window.liQ_instances).to.be.undefined()
    MinimalLiveConnect({ globalVarName: 'liQ' }, storage, calls)
    expect(window.liQ).to.not.be.undefined()
    expect(window.liQ_instances).to.not.be.undefined()
  })

  it('should only add liQ_instances to the window object', () => {
    const exisitingKeys = Object.keys(window)
    MinimalLiveConnect({}, storage, calls)
    const keysAfterInit = Object.keys(window)
    const constNewKeys = keysAfterInit.filter(v => !exisitingKeys.includes(v))
    expect(constNewKeys).to.be.eql(['liQ_instances'])
  })

  it('should expose liQ via the initializer', () => {
    expect(window.liQ).to.be.undefined()
    LiveConnect({ globalVarName: 'liQ' }, storage, calls, 'minimal')
    expect(window.liQ).to.not.be.undefined()
  })

  it('should only add liQ_instances to the window object via the initializer', () => {
    const exisitingKeys = Object.keys(window)
    LiveConnect({}, storage, calls, 'minimal')
    const keysAfterInit = Object.keys(window)
    const constNewKeys = keysAfterInit.filter(v => !exisitingKeys.includes(v))
    expect(constNewKeys).to.be.eql(['liQ_instances'])
  })

  it('should accept a single event', () => {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.push({ event: 'some' })
  })

  it('should accept a single event and put it in the queue', () => {
    const lc = MinimalLiveConnect({ globalVarName: 'liQ' }, storage, calls)
    lc.push({ event: 'some' })
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept a single event via the initializer', () => {
    const lc = LiveConnect({}, storage, calls, 'minimal')
    lc.push({ event: 'some' })
  })

  it('should accept a single event and put it in the queue via the initializer', () => {
    const lc = LiveConnect({ globalVarName: 'liQ' }, storage, calls, 'minimal')
    lc.push({ event: 'some' })
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept firing an event', () => {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.fire()
  })

  it('should accept firing an event and put it in the queue', () => {
    const lc = MinimalLiveConnect({ globalVarName: 'liQ' }, storage, calls)
    lc.fire()
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept firing an event via the initializer', () => {
    const lc = LiveConnect({}, storage, calls, 'minimal')
    lc.fire()
  })

  it('should accept firing an event and put it in the queue via the initializer', () => {
    const lc = LiveConnect({ globalVarName: 'liQ' }, storage, calls, 'minimal')
    lc.fire()
  })

  it('should return the resolution Url', () => {
    const lc = MinimalLiveConnect({}, storage, calls)
    expect(lc.resolutionCallUrl()).to.eql('https://idx.liadm.com/idex/unknown/any')
  })

  it('should expose the config', () => {
    const config = { appId: 'a-00xx', identifiersToResolve: [] }
    const lc = MinimalLiveConnect(config, storage, calls)
    expect(lc.config).to.eql(config)
  })

  it('should expose the LC instance as globalVarName instead of liQ when provided', () => {
    expect(window.liQTest).to.be.undefined()
    expect(window.liQ).to.be.undefined()
    const lc = MinimalLiveConnect({ globalVarName: 'liQTest' }, storage, calls)
    expect(window.liQ).to.be.undefined()
    expect(window.liQTest).to.not.be.undefined()
    expect(window.liQTest).to.be.an('array')
    expect(lc.ready).to.be.true()
    expect(window.liQ_instances).to.have.members([lc])
  })

  it('should remove distributorId when both appId and distributorId are present', () => {
    const config = { appId: 'a-00xx', distributorId: 'did-00xx', globalVarName: 'liQTest' }
    const lc = MinimalLiveConnect(config, storage, calls)
    const expectedConfig = { appId: 'a-00xx', globalVarName: 'liQTest', identifiersToResolve: [] }
    expect(lc.config).to.eql(expectedConfig)
  })

  it('should expose the eventBus through the LC instance', () => {
    const lc = MinimalLiveConnect({}, storage, calls)
    expect(lc.eventBus).to.not.be.undefined()
  })
})
