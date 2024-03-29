import { LocalEventBus } from '../../../src/events/event-bus.js'
import { DefaultCallHandler, DefaultStorageHandler } from 'live-connect-handlers'
import { StandardLiveConnect } from '../../../src/index.js'
import { mergeObjects } from '../../../src/pixel/fiddler.js'
import { LiveConnectConfig } from '../../../src/types.js'

const customerSpecifics = (window as unknown as { LI: LiveConnectConfig }).LI || {}
const queue = window.liQ || []

const eventBus = LocalEventBus()
const storage = new DefaultStorageHandler(eventBus)
const calls = new DefaultCallHandler()

const lc = StandardLiveConnect(
  mergeObjects(
    customerSpecifics,
    {
      // @ts-expect-error
      trackerVersion: LC_VERSION,
      contextSelectors: 'p',
      contextElementsLength: '100'
    }
  ),
  storage,
  calls,
  eventBus
)

if (Array.isArray(queue)) {
  queue.forEach(q => lc.push!(q))
}
window.liQ = lc
