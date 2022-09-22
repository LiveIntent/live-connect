import { StandardLiveConnect } from '../../../src/standard-live-connect'
import * as storage from '../../shared/utils/storage'
import * as calls from '../../shared/utils/calls'
import { merge } from '../../../src/utils/types'

const customerSpecifics = window.LI || {}
const queue = window.liQ || []

const lc = StandardLiveConnect(merge(customerSpecifics, { trackerName: 'LC_VERSION', contextSelectors: 'p', contextElementsLength: '100' }), storage, calls)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
