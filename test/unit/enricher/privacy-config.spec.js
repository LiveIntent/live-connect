import { expect, use } from 'chai'
import * as pageEnricher from '../../../src/enrichers/privacy-config'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('PrivacyConfigEnricher', () => {
  it('should return privacyMode set to true when gdprApplies is true', function () {
    const state = {
      gdprApplies: true
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: true
    })
  })

  it('should return empty enrichment when gdprApplies is undefined', function () {
    const state = {
      someTestField: 'a'
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({})
  })

  it('should return privacyMode set to true when gdprApplies is defined but is not a boolean value', function () {
    const state = {
      gdprApplies: 'a'
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: true
    })
  })

  it('should return privacyMode set to false when gdprApplies is false', function () {
    const state = {
      gdprApplies: false
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: false
    })
  })
})
