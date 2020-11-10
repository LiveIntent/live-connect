import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { urlParams } from '../../src/utils/url'
import { expect } from 'chai'
import { MinimalLiveConnect } from '../../src/minimal-live-connect'
import * as storage from '../shared/utils/storage'
import * as calls from '../shared/utils/calls'

describe('MinimalLiveConnect', () => {
  const sandbox = sinon.createSandbox()
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
    expect(window.liQ).to.be.undefined
    MinimalLiveConnect({}, storage, calls)
    expect(window.liQ).to.not.be.undefined
  })

  it('should accept a single event and put it in the queue', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.push({ event: 'some' })
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
  })

  it('should accept firing an event and put it in the queue', function () {
    const lc = MinimalLiveConnect({}, storage, calls)
    lc.fire()
    console.log(window.liQ)
    expect(window.liQ.length).to.eql(1)
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

})
