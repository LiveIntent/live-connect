import { expect, use } from 'chai'
import { enrichLiveConnectId } from '../../../src/enrichers/live-connect-id'
import { DefaultStorageHandler } from 'live-connect-handlers'
import sinon from 'sinon'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { LocalEventBus } from '../../../src/events/event-bus'
import { NoOpCache, StorageHandlerBackedCache } from '../../../src/cache'
import { StorageStrategies, StorageStrategy } from '../../../src/model/storage-strategy'
import { expiresInHours } from 'live-connect-common'

use(dirtyChai)

function makeDeps(strategy: StorageStrategy = StorageStrategies.cookie) {
  const domain = '.example.com'
  const eventBus = LocalEventBus()
  const storage = new DefaultStorageHandler(eventBus)
  const storageHandler = WrappedStorageHandler.make(strategy, storage, eventBus)

  let cache
  if (strategy === 'cookie' || strategy === 'ls') {
    cache = new StorageHandlerBackedCache({ strategy, storageHandler, domain })
  } else {
    cache = NoOpCache
  }
  return { storageHandler, cache, eventBus, domain }
}

describe('LiveConnectIdEnricher', () => {
  sinon.createSandbox()

  beforeEach(() => {
    jsdom('', {
      url: 'http://www.example.com'
    })
  })

  it('should create a first party cookie if it doesn\'t exist', () => {
    const deps = makeDeps('cookie')
    const { storageHandler } = deps

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)

    const resolutionResult = enrichLiveConnectId(deps)

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party cookie if it doesn\'t exist, and storage strategy is cookie', () => {
    const deps = makeDeps('cookie')
    const { storageHandler } = deps

    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(null)
    const resolutionResult = enrichLiveConnectId(deps)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should create a first party identifier in local storage if it doesn\'t exist, and storage strategy is ls', () => {
    const deps = makeDeps('ls')
    const { storageHandler } = deps

    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(null)

    const resolutionResult = enrichLiveConnectId(deps)

    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi')).to.eql(resolutionResult.liveConnectId)
    expect(storageHandler.getDataFromLocalStorage('_lc2_fpi_exp')).to.be.not.null()
    expect(storageHandler.getDataFromLocalStorage('_li_duid')).to.eql(resolutionResult.liveConnectId)
  })

  it('should not create or return a first party identifier if the StorageStrategy is set to "none"', () => {
    const deps = makeDeps('none')

    const resolutionResult = enrichLiveConnectId(deps)

    expect(resolutionResult.liveConnectId).to.be.undefined()
    expect(resolutionResult.peopleVerifiedId).to.be.undefined()
  })

  it('should re-use a first party cookie if it exist', () => {
    const deps = makeDeps('cookie')
    const { storageHandler } = deps

    const id = 'xxxxx'
    storageHandler.setCookie('_lc2_fpi', id, expiresInHours(4), undefined, '.example.com')

    const resolutionResult = enrichLiveConnectId(deps)
    expect(storageHandler.getCookie('_lc2_fpi')).to.eql(id)
    expect(resolutionResult.liveConnectId).to.eql(id)
  })

  it('should create a first party cookie that starts with apex domain hash', () => {
    const deps = makeDeps('cookie')
    const { storageHandler } = deps

    enrichLiveConnectId(deps)

    // apexOfExampleCom = '0caaf24ab1a0'
    expect(storageHandler.getCookie('_lc2_fpi')).to.match(/0caaf24ab1a0--.*/)
  })

  it('should create a first party cookie that is lowercased', () => {
    const deps = makeDeps('cookie')
    const { storageHandler } = deps

    enrichLiveConnectId(deps)

    expect(storageHandler.getCookie('_lc2_fpi')).to.satisfy((cookie: string) => cookie === cookie.toLowerCase())
  })
})
