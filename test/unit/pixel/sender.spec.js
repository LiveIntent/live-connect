import { expect } from 'chai'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { PixelSender } from '../../../src/pixel/sender'

describe('PixelSender', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  it('exposes the send function', function () {
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, null)
    expect(typeof sender.send).to.eql('function')
  })

  it('default to production if none set', function () {
    const sandbox = sinon.createSandbox()
    const obj = {}
    const imgStub = sandbox.stub(window, 'Image').returns(obj)
    const sender = new PixelSender({})
    sender.send({ asQueryString: () => '?xxx=yyy', sendsPixel: () => true })
    expect(obj.src).to.match(/https:\/\/rp.liadm.com\/p\?xxx=yyy&dtstmp=\d+/)
    imgStub.restore()
  })

  it('send an image pixel and call onload if request succeeds', function () {
    const sandbox = sinon.createSandbox()
    const obj = {}
    const imgStub = sandbox.stub(window, 'Image').returns(obj)
    const onload = () => 1
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, onload)
    sender.send({ asQueryString: () => '?xxx=yyy', sendsPixel: () => true })
    expect(obj.src).to.match(/http:\/\/localhost\/p\?xxx=yyy&dtstmp=\d+/)
    expect(obj.onload).to.eql(onload)
    imgStub.restore()
  })

  it('send an image pixel and call onerror request fails', function () {
    const sandbox = sinon.createSandbox()
    const obj = {}
    const imgStub = sandbox.stub(window, 'Image').returns(obj)
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, null)
    sender.send({ asQueryString: () => '?zzz=ccc', sendsPixel: () => true })
    expect(obj.src).to.match(/http:\/\/localhost\/p\?zzz=ccc&dtstmp=\d+/)
    expect(obj.onload).to.eql(undefined)
    imgStub.restore()
  })

  it('does not send an image pixel if sendsPixel resolves to false', function () {
    const sandbox = sinon.createSandbox()
    const obj = {}
    const imgStub = sandbox.stub(window, 'Image').returns(obj)
    const sender = new PixelSender({ collectorUrl: 'http://localhost' }, null)
    sender.send({ asQueryString: () => '?zzz=ccc', sendsPixel: () => false })
    expect(obj.onload).to.eql(undefined)
    imgStub.restore()
  })
})
