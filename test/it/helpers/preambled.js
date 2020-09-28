const liveConnect = require('../../../src/live-connect')
const storage = require('../../shared/utils/storage')

const customerSpecifics = window.LI || {}
const queue = window.liQ || []

const lc = liveConnect.LiveConnect({ ...customerSpecifics, ...{ trackerName: 'LC_VERSION' } }, storage)

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
