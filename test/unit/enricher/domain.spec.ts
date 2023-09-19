import { expect, use } from 'chai'
import { enrichDomain } from '../../../src/enrichers/domain'
import { DefaultStorageHandler } from 'live-connect-handlers'
import jsdom from 'global-jsdom'
import dirtyChai from 'dirty-chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler'
import { LocalEventBus } from '../../../src/events/event-bus'

use(dirtyChai)

const eventBus = LocalEventBus()
const storage = new DefaultStorageHandler(eventBus)
const storageHandler = WrappedStorageHandler.make('cookie', storage, eventBus)
const input = {}

describe('TLD checker', () => {
  beforeEach(() => jsdom('', {
    url: 'http://subdomain.tests.example.com'
  }))

  it('should determine correct tld', () => {
    const resolved = enrichDomain(storageHandler)(input)
    expect(resolved.domain).to.eq('.example.com')
  })

  it('should reuse the cached correct tld', () => {
    storageHandler.setCookie('_li_dcdm_c', '.example.com')
    const resolved = enrichDomain(storageHandler)(input)
    expect(resolved.domain).to.eq('.example.com')
  })
})

describe('TLD on sub-domain', () => {
  beforeEach(() => jsdom('', {
    url: 'http://example.co.uk'
  }))

  it('should use the full domain', () => {
    const resolved = enrichDomain(storageHandler)(input)
    expect(resolved.domain).to.eq('.example.co.uk')
  })
})
