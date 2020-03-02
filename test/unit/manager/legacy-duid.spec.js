import { expect } from 'chai'
import { resolve } from '../../../src/manager/legacy-duid'
import { getLegacyId } from '../../../src/utils/legacy'
import jsdom from 'mocha-jsdom'
import * as storage from '../../../src/utils/storage'

describe('LegacyDuidHelper', () => {
  jsdom({
    url: 'http://www.nordstromrack.com',
    useEach: true
  })

  it('should create a local storage entry if it does not exit', function () {
    expect(storage.getDataFromLocalStorage('_litra_id.edec')).to.eql(null)
    resolve({ appId: 'a-XXXX' }, storage)
    const legacyDuidString = storage.getDataFromLocalStorage('_litra_id.edec')
    const legacyId = getLegacyId(legacyDuidString)
    expect(legacyId.duid).to.match(/a-XXXX--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    expect(parseInt(legacyId.currVisitTs)).to.be.closeTo(Math.round(new Date().getTime() / 1000), 3)
    expect(parseInt(legacyId.lastSessionVisitTs)).to.be.closeTo(Math.round(new Date().getTime() / 1000), 3)
    expect(parseInt(legacyId.creationTs)).to.be.closeTo(Math.round(new Date().getTime() / 1000), 3)
  })

  it('should  not create a local storage entry if the app id isn\'t present', function () {
    expect(storage.getDataFromLocalStorage('_litra_id.edec')).to.eql(null)
    resolve({}, storage)
    expect(storage.getDataFromLocalStorage('_litra_id.edec')).to.eql(null)
  })

  it('should update the entry in local storage with fresh timestamps', function () {
    storage.setDataInLocalStorage('_litra_id.edec', 'a-XXXX--e4f71227-70d0-4e54-b1c3-ACf80616bbb0.1538047703.39.1573030646.1550763182.eaff6045-fa6f-4073-9397-598a9e64ca12')
    resolve({ appId: 'a-XXXX' }, storage)
    const legacyDuidString = storage.getDataFromLocalStorage('_litra_id.edec')
    const legacyId = getLegacyId(legacyDuidString)
    expect(legacyId.duid).to.eql('a-XXXX--e4f71227-70d0-4e54-b1c3-ACf80616bbb0')
    expect(parseInt(legacyId.currVisitTs)).to.be.closeTo(Math.round(new Date().getTime() / 1000), 3)
    expect(parseInt(legacyId.lastSessionVisitTs)).to.eql(1573030646)
    expect(parseInt(legacyId.creationTs)).to.eql(1538047703)
  })
})
