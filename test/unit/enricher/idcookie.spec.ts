import { expect, use } from 'chai'
import jsdom from 'global-jsdom'
import { DefaultStorageHandler } from 'live-connect-handlers'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { LocalEventBus } from '../../../src/events/event-bus'
import { enrichIdCookie } from '../../../src/enrichers/idcookie'

use(dirtyChai)

const eventBus = LocalEventBus()
const storageHandler = WrappedStorageHandler.make('cookie', new DefaultStorageHandler(eventBus), eventBus)

describe('IdentifiersEnricher', () => {
  beforeEach(() => jsdom('', { url: 'http://www.example.com' }))

  it('enrich provided cookie', () => {
    const key = 'foo'
    const value = 'bar'
    storageHandler.setCookie(key, value)
    const result = enrichIdCookie(storageHandler)({ idCookie: { mode: 'provided', strategy: 'cookie', name: key } })

    expect(result.resolvedIdCookie).to.eql(value)
  })

  it('enrich provided ls', () => {
    const key = 'foo'
    const value = 'bar'
    storageHandler.setDataInLocalStorage(key, value)
    const result = enrichIdCookie(storageHandler)({ idCookie: { mode: 'provided', strategy: 'localStorage', name: key } })

    expect(result.resolvedIdCookie).to.eql(value)
  })
})
