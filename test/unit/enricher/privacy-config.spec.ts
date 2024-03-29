import { expect, use } from 'chai'
import { enrichPrivacyMode } from '../../../src/enrichers/privacy-config.js'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('PrivacyConfigEnricher', () => {
  it('should return privacyMode set to true when gdprApplies is true', () => {
    const state = {
      gdprApplies: true
    }
    const result = enrichPrivacyMode(state)

    expect(result.privacyMode).to.be.true()
  })

  it('should return empty enrichment when gdprApplies is undefined', () => {
    const state = { someTestField: 'a', gdprApplies: undefined }

    const result = enrichPrivacyMode(state)

    expect(result.privacyMode).to.be.false()
  })

  it('should return privacyMode set to true when gdprApplies is defined but is not a boolean value', () => {
    const state = {
      gdprApplies: 'a' as unknown as boolean
    }

    const result = enrichPrivacyMode(state)

    expect(result.privacyMode).to.be.true()
  })

  it('should return privacyMode set to false when gdprApplies is false', () => {
    const state = {
      gdprApplies: false
    }
    const result = enrichPrivacyMode(state)

    expect(result.privacyMode).to.be.false()
  })

  it('should return privacyMode set to true when gdprApplies is false and gppApplicableSections contains 2', () => {
    const state = {
      gdprApplies: false,
      gppApplicableSections: [2]
    }
    const result = enrichPrivacyMode(state)

    expect(result.privacyMode).to.be.true()
  })
})
