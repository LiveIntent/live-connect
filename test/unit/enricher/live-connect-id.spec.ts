import { expect, use } from 'chai'
import { enrichLiveConnectId } from '../../../src/enrichers/live-connect-id'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon from 'sinon'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { LocalEventBus } from '../../../src/events/event-bus'
import { StorageHandlerBackedCache } from '../../../src/cache'
import { StorageStrategies, StorageStrategy } from '../../../src/model/storage-strategy'
import { expiresInHours } from 'live-connect-common'

use(dirtyChai)

function makeDeps(strategy: StorageStrategy = StorageStrategies.cookie) {
  const domain = '.example.com'
  const eventBus = LocalEventBus()
  const storage = new DefaultStorageHandler(eventBus)
  const storageHandler = WrappedStorageHandler.make(strategy, storage, eventBus)
  const cache = new StorageHandlerBackedCache({ storageHandler, domain, eventBus })
  return { storageHandler, cache, domain }
}

describe('LiveConnectIdEnricher', () => {
  sinon.createSandbox()

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.example.com'
    })
  })

  it('should create a first party cookie if it doesn\'t exist', () => {
    const { cache, storageHandler, ...args } = makeDeps('cookie')

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)

    const resolutionResult = enrichLiveConnectId(cache, storageHandler)(args)

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party cookie & ls entry if it doesn\'t exist', () => {
    const { cache, storageHandler, ...args } = makeDeps('cookie')

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(null)
    const resolutionResult = enrichLiveConnectId(cache, storageHandler)(args)

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getCookie('_lc2_fpi_meta')).to.be.not.null()
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi_meta')).to.be.not.null()
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should not create or return a first party identifier if the StorageStrategy is set to "none"', () => {
    const { cache, storageHandler, ...args } = makeDeps('none')

    const resolutionResult = enrichLiveConnectId(cache, storageHandler)(args)

    expect(resolutionResult.liveConnectId).to.be.undefined()
    expect(resolutionResult.peopleVerifiedId).to.be.undefined()
  })

  it('should re-use a first party cookie if it exist', () => {
    const { cache, storageHandler, ...args } = makeDeps('cookie')

    const id = 'xxxxx'
    storageHandler.setCookie('_lc2_fpi', id, expiresInHours(4), undefined, '.example.com')

    const resolutionResult = enrichLiveConnectId(cache, storageHandler)(args)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(id)
    expect(resolutionResult.liveConnectId).to.eql(id)
  })

  it('should create a first party cookie that starts with apex domain hash', () => {
    const { cache, storageHandler, ...args } = makeDeps('cookie')

    enrichLiveConnectId(cache, storageHandler)(args)

    // apexOfExampleCom = '0caaf24ab1a0'
    expect(storageHandler.getCookie('_lc2_fpi')).to.match(/0caaf24ab1a0--.*/)
  })

  it('should create a first party cookie that is lowercased', () => {
    const { cache, storageHandler, ...args } = makeDeps('cookie')

    enrichLiveConnectId(cache, storageHandler)(args)

    expect(storageHandler.getCookie('_lc2_fpi')).to.satisfy((cookie: string) => cookie === cookie.toLowerCase())
  })
})
