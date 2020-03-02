import { expect } from 'chai'
import sinon from 'sinon'
import jsdom from 'mocha-jsdom'
import * as peopleVerified from '../../../src/manager/people-verified'
import * as storage from '../../../src/utils/storage'

describe('PeopleVerifiedManager', () => {
  const sandbox = sinon.createSandbox()
  jsdom({
    url: 'http://www.example.com',
    useEach: true
  })

  it('should keep the people_verified if the legacyId is "fresh"', function () {
    storage.setDataInLocalStorage('_li_duid', 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0')
    const state = {
      legacyId: {
        duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
        creationTs: '1538047703',
        sessionCount: '39',
        currVisitTs: `${(new Date().getTime() - (13 * 864e5)) / 1000}`,
        lastSessionVisitTs: '1550763182',
        sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'

      }
    }
    const result = peopleVerified.resolve(state, storage)
    expect(result.peopleVerifiedId).to.eql('a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0')
  })

  it('should return an empty object if something fails', function () {
    const stub = sandbox.stub(storage, 'getDataFromLocalStorage').throws()
    const state = {
      legacyId: {
        duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
        creationTs: '1538047703',
        sessionCount: '39',
        currVisitTs: `${(new Date().getTime() - (13 * 864e5)) / 1000}`,
        lastSessionVisitTs: '1550763182',
        sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'

      }
    }
    const result = peopleVerified.resolve(state, storage)
    expect(result).to.eql({})
    stub.restore()
  })

  it('should set the people_verified if the legacyId is "fresh", but there is nothing in ls', function () {
    const state = {
      liveConnectId: 'xxx',
      legacyId: {
        duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
        creationTs: '1538047703',
        sessionCount: '39',
        currVisitTs: `${(new Date().getTime() - (13 * 864e5)) / 1000}`,
        lastSessionVisitTs: '1550763182',
        sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'

      }
    }
    const result = peopleVerified.resolve(state, storage)
    // TODO: Replace this with 'xxx' once we remove support for legacy ids
    expect(result.peopleVerifiedId).to.eql('a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0')
    expect(storage.getDataFromLocalStorage('_li_duid')).to.eql('a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0')
  })

  it('should set the people_verified if the legacyId is not "fresh"(older than 181 days)', function () {
    const state = {
      liveConnectId: 'yyy',
      legacyId: {
        duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
        creationTs: '1538047703',
        sessionCount: '39',
        currVisitTs: `${(new Date().getTime() - (182 * 864e5)) / 1000}`,
        lastSessionVisitTs: '1550763182',
        sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'
      }
    }
    const result = peopleVerified.resolve(state, storage)
    expect(result.peopleVerifiedId).to.eql('yyy')
    expect(storage.getDataFromLocalStorage('_li_duid')).to.eql('yyy')
  })

  it('should not set the id in LS if it is null', function () {
    const state = {
      liveConnectId: null
    }
    const result = peopleVerified.resolve(state, storage)
    expect(result.peopleVerifiedId).to.eql(null)
  })
})
