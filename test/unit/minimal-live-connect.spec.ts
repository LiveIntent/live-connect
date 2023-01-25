import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect, use } from 'chai'
import { MinimalLiveConnect } from '../../src/minimal-live-connect'
import { EVENT_BUS_NAMESPACE } from '../../src/utils/consts'
import { LiveConnect } from '../../src/initializer'
import { TestStorageHandler } from '../shared/utils/storage'
import { TestCallHandler } from '../shared/utils/calls'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('MinimalLiveConnect', () => {
  const sandbox = sinon.createSandbox()
  const storage = new TestStorageHandler()
  const calls = TestCallHandler

  let imgStub = null
  let pixelCalls = []
  let errorCalls = []
  jsdom({
    url: 'http://www.example.com/?sad=0&dsad=iou',
    useEach: true
  })

  afterEach(() => {
    imgStub.restore()
  })

  beforeEach(() => {
    pixelCalls = []
    errorCalls = []
    global.XDomainRequest = null
    global.XMLHttpRequest = sandbox.useFakeXMLHttpRequest()
    global.XMLHttpRequest.onCreate = function (xhr) {
      pixelCalls.push(xhr)
    }
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').callsFake(() => {
      const obj = {
        onload: onload
      }
      errorCalls.push(obj)
      return obj
    })
  })

  it('should expose liQ', function () {
    expect(window.liQ).to.be.undefined()
    MinimalLiveConnect({}, storage, calls)
    expect(window.liQ).to.not.be.undefined()
  })

  it('should expose liQ via the initializer', function () {
    expect(window.liQ).to.be.undefined()
    LiveConnect({}, storage, calls, 'minimal')
    expect(window.liQ).to.not.be.undefined()
    expect(window[EVENT_BUS_NAMESPACE]).to.not.be.undefined()
  })

  it('should accept a single event and put it in the queue', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.push({ event: 'some' })
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept a single event and put it in the queue via the initializer', function () {
    const lc = LiveConnect({}, storage, calls, 'minimal')
    lc.push({ event: 'some' })
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
    expect(window[EVENT_BUS_NAMESPACE]).to.not.be.undefined()
  })

  it('should accept firing an event and put it in the queue', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.fire()
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept firing an event and put it in the queue via the initializer', function () {
    const lc = LiveConnect({}, storage, calls, 'minimal')
    lc.fire()
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
    expect(window[EVENT_BUS_NAMESPACE]).to.not.be.undefined()
  })

  it('should return the resolution Url', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    expect(lc.resolutionCallUrl()).to.eql('https://idx.liadm.com/idex/unknown/any')
  })

  it('should expose the config', function () {
    const config = { appId: 'a-00xx' }
    const lc = MinimalLiveConnect(config, storage, calls)
    expect(lc.config).to.eql(config)
  })

  it('should expose the LC instance as globalVarName instead of liQ when provided', function () {
    expect(window.liQTest).to.be.undefined()
    expect(window.liQ).to.be.undefined()
    const lc = MinimalLiveConnect({ globalVarName: 'liQTest' }, storage, calls)
    expect(window.liQ).to.be.undefined()
    expect(window.liQTest).to.not.be.undefined()
    expect(window.liQTest).to.be.an('array')
    expect(lc.ready).to.be.true()
    expect(window.liQ_instances).to.have.members([lc])
  })

  it('should remove distributorId when both appId and distributorId are present', function () {
    const config = { appId: 'a-00xx', distributorId: 'did-00xx', globalVarName: 'liQTest' }
    const lc = MinimalLiveConnect(config, storage, calls)
    const expectedConfig = { appId: 'a-00xx', globalVarName: 'liQTest' }
    expect(lc.config).to.eql(expectedConfig)
  })

  it('should expose the eventBus through the LC instance', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    expect(lc.eventBus).to.not.be.undefined()
  })
})
