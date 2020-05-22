import { expect } from 'chai'
import { enrich } from '../../../src/enrichers/legacy-duid'
import jsdom from 'mocha-jsdom'
import * as storage from '../../../src/utils/storage'

describe('LegacyDuidEnricher', () => {
  jsdom({
    url: 'http://www.nordstromrack.com',
    useEach: true
  })

  it('should read the legacyId', function () {
    storage.setDataInLocalStorage('_litra_id.edec', 'a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0.1538047703.39.1573030646.1550763182.eaff6045-fa6f-4073-9397-598a9e64ca12')
    const resolutionResult = enrich({ appId: 'a-XXXX' }, storage)
    expect('a-0z68--e4f71227-70d0-4e54-b1c3-ACf80616bbb0').to.eql(resolutionResult.legacyId.duid)
  })
})
