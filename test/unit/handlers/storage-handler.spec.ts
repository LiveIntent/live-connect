import jsdom from 'global-jsdom'
import { expect, use } from 'chai'
import { WrappedStorageHandler } from '../../../src/handlers/storage-handler.js'
import sinon, { SinonStub } from 'sinon'
import { EventBus } from 'live-connect-common'
import dirtyChai from 'dirty-chai'
import { LocalEventBus } from '../../../src/events/event-bus.js'

use(dirtyChai)

type RecordedError = {
  name: string
  message: string
  exception?: unknown
}

describe('StorageHandler', () => {
  let errors: RecordedError[] = []
  let eventBusStub: SinonStub<[string, string, unknown?], EventBus>
  const eventBus = LocalEventBus()
  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    errors = []
    jsdom('', {
      url: 'http://www.something.example.com'
    })

    eventBusStub = sandbox.stub(eventBus, 'emitErrorWithMessage').callsFake((name, message, e) => {
      errors.push({
        name,
        message,
        exception: e
      })
      return eventBus
    })
  })

  afterEach(() => {
    eventBusStub.restore()
  })

  it('should send an error if an external handler is not provided', () => {
    WrappedStorageHandler.make('cookie', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","localStorageIsEnabled","setCookie","removeDataFromLocalStorage","setDataInLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should send an error if an external handler is not provided and the storage strategy is none', () => {
    WrappedStorageHandler.make('none', {}, eventBus)
    expect(errors.length).to.be.eq(1)
    expect(errors[0].name).to.be.eq('StorageHandler')
    expect(errors[0].message).to.be.eq('The functions \'["getCookie","getDataFromLocalStorage","findSimilarCookies"]\' were not provided')
    expect(errors[0].exception).to.be.undefined()
  })

  it('should not send an error if an external handler is not provided and the storage strategy is disabled', () => {
    WrappedStorageHandler.make('disabled', {}, eventBus)
    expect(errors.length).to.be.eq(0)
  })
})
