const liveConnect = require('../../../src/standard-live-connect')
const storage = require('../../shared/utils/storage')
const calls = require('../../shared/utils/calls')
const helpers = require('../../../src/utils/types')

const customerSpecifics = window.LI || {}
const queue = window.liQ || []

const lc = liveConnect.StandardLiveConnect(helpers.merge(customerSpecifics, { trackerName: 'LC_VERSION' }), storage, calls)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
