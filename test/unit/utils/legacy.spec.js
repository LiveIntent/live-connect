import { expect } from 'chai'
import * as legacyHelper from '../../../src/utils/legacy'

describe('LegacyIdHelper', () => {

  it('return undefined if called with nothing', function () {
    expect(legacyHelper.getLegacyId()).to.eql(undefined)
    expect(legacyHelper.getLegacyId(undefined)).to.eql(undefined)
    expect(legacyHelper.getLegacyId(null)).to.eql(undefined)
  })

  it('return the LegacyId object for a valid entry', function () {
    const stringRepr = 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0.1538047703.39.1573030646.1550763182.eaff6045-fa6f-4073-9397-598a9e64ca12'
    expect({
      duid: 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0',
      creationTs: '1538047703',
      sessionCount: '39',
      currVisitTs: '1573030646',
      lastSessionVisitTs: '1550763182',
      sessionId: 'eaff6045-fa6f-4073-9397-598a9e64ca12'

    }).to.eql(legacyHelper.getLegacyId(stringRepr))
  })
})
