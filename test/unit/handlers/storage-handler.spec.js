import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import { expect } from 'chai'
import { StorageHandler } from '../../../src/handlers/storage-handler'
import  * as lcStorage  from '../../../src/utils/storage'


describe('StorageHandler', () => {
  jsdom({
    url: 'http://www.something.example.com',
    useEach: true
  })

  it('should respect StorageStrategy == "none" for reads', function() {
    const storageHandler = StorageHandler('none')
    storageHandler.setCookie('x', 'value-of-x')
    storageHandler.setDataInLocalStorage('y', 'value-of-y')
    expect(lcStorage.getCookie('x')).to.be.null
    expect(lcStorage.getDataFromLocalStorage('y')).to.be.null
    expect(lcStorage.findSimilarCookies('x')).to.be.eql([])
  })

  it('should fallback to lcStorage if external hander is not provided', function() {
    const storageHandler = StorageHandler('cookie')
    storageHandler.setCookie('x', 'value-of-x')
    expect(storageHandler.getCookie).to.be.eql(lcStorage.getCookie)
    expect(lcStorage.getCookie('x')).to.be.eq('value-of-x')
    expect(lcStorage.findSimilarCookies('x')).to.be.eql(['value-of-x'])
  })
  it('should use external storage handler if provided', function() {
    const calls =  {}
    const extStorageHandler = {
      setCookie: function() {
        calls.setCookie = Array.from(arguments)
      }
    }
    const storageHandler = StorageHandler('cookie', extStorageHandler)
    storageHandler.setCookie('x', 'value-of-x')
    expect(calls.setCookie).to.be.eql(['x', 'value-of-x'])
    expect(lcStorage.getCookie('x')).to.be.null
  })

  it('should use lcStorage as fallback if storage handler is provided for a function', function() {
    const calls = {}
    const extStorageHandler = {
      setCookie: function() {
        calls.setCookie = Array.from(arguments)
      }
    }
    const storageHandler = StorageHandler('cookie', extStorageHandler)
    storageHandler.setDataInLocalStorage('x', 'value-of-x')
    expect(calls.setDataInLocalStorage).to.be.undefined
    expect(lcStorage.getDataFromLocalStorage('x')).to.be.eq('value-of-x')
  })
})
