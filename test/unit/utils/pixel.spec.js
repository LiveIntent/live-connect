import { expect } from 'chai'
import sinon from 'sinon'
import { sendPixel } from '../../../src/utils/pixel'
import jsdom from 'mocha-jsdom'

describe('Pixel Utils', () => {
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })
  const sandbox = sinon.createSandbox()
  let imgStub

  afterEach(() => {
    if (imgStub) {
      imgStub.restore()
      imgStub = undefined
    }
  })

  it('should call pixel with an onload function', function () {
    const obj = {}
    const onload = () => 1
    imgStub = sandbox.stub(window, 'Image').returns(obj)

    sendPixel('http://localhost', onload)

    expect(obj.src).to.eq('http://localhost')
    expect(obj.onload).to.eq(onload)
  })

  it('should call pixel when the onload function is not provided', function () {
    const obj = {}
    imgStub = sandbox.stub(window, 'Image').returns(obj)

    sendPixel('http://localhost', null)

    expect(obj.src).to.eq('http://localhost')
    expect(obj.onload).to.be.undefined()
  })
})
