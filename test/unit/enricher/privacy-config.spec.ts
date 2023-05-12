import { expect, use } from 'chai'
import * as pageEnricher from '../../../src/enrichers/privacy-config'
import dirtyChai from 'dirty-chai'
import { State } from '../../../src/types'

use(dirtyChai)

describe('PrivacyConfigEnricher', () => {
  it('should return privacyMode set to true when gdprApplies is true', () => {
    const state = {
      gdprApplies: true
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: true
    })
  })

  it('should return empty enrichment when gdprApplies is undefined', () => {
    const state = {
      someTestField: 'a'
    } as State
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({})
  })

  it('should return privacyMode set to true when gdprApplies is defined but is not a boolean value', () => {
    const state = {
      gdprApplies: 'a'
    }
    // @ts-expect-error
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: true
    })
  })

  it('should return privacyMode set to false when gdprApplies is false', () => {
    const state = {
      gdprApplies: false
    }
    const result = pageEnricher.enrich(state)

    expect(result).to.eql({
      privacyMode: false
    })
  })
})
