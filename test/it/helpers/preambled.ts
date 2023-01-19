import { LocalEventBus } from '../../../src/events/event-bus'
import { TestStorageHandler } from '../../shared/utils/storage'
import * as liveConnect from '../../../src/standard-live-connect'
import { TestCallHandler } from '../../shared/utils/calls'
import * as helpers from '../../../src/utils/types'
import { LiveConnectConfig } from '../../../src/types'

const customerSpecifics = (window as unknown as { LI: LiveConnectConfig }).LI || {}
const queue = window.liQ || []

const eventBus = LocalEventBus()
const storage = new TestStorageHandler(eventBus)

const lc = liveConnect.StandardLiveConnect(helpers.merge(customerSpecifics, { trackerName: 'LC_VERSION', contextSelectors: 'p', contextElementsLength: '100' }), storage, TestCallHandler, eventBus)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
