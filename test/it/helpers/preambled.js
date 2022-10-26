import { LocalEventBus } from '../../../src/events/event-bus'
import { Storage } from '../../shared/utils/storage'
import * as liveConnect from '../../../src/standard-live-connect'
import * as calls from '../../shared/utils/calls'
import * as helpers from '../../../src/utils/types'

const customerSpecifics = window.LI || {}
const queue = window.liQ || []

const messageBus = LocalEventBus()
const storage = new Storage(messageBus)

const lc = liveConnect.StandardLiveConnect(helpers.merge(customerSpecifics, { trackerName: 'LC_VERSION', contextSelectors: 'p', contextElementsLength: '100' }), storage, calls, messageBus)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
