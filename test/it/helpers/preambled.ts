import { LocalEventBus } from '../../../src/events/event-bus'
import { DefaultCallHandler, DefaultStorageHandler } from 'live-connect-handlers'
import { StandardLiveConnect } from '../../../src/standard-live-connect'
import { mergeObjects } from '../../../src/pixel/fiddler'
import { LiveConnectConfig } from '../../../src/types'

const customerSpecifics = (window as unknown as { LI: LiveConnectConfig }).LI || {}
const queue = window.liQ || []

const eventBus = LocalEventBus()
const storage = new DefaultStorageHandler(eventBus)
const calls = new DefaultCallHandler()

const lc = StandardLiveConnect(mergeObjects(customerSpecifics, { trackerName: 'LC_VERSION', contextSelectors: 'p', contextElementsLength: '100' }), storage, calls, eventBus)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
