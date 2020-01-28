const liveConnect = require('./live-connect')

const customerSpecifics = window.LI || {}
const queue = window.liQ || []

const lc = liveConnect.LiveConnect({ ...customerSpecifics, ...{ trackerName: 'LC_VERSION' } })

if (Array.isArray(queue)) {
  for (let i = 0; i < queue.length; i++) {
    lc.push(queue[i])
  }
}
window.liQ = lc
