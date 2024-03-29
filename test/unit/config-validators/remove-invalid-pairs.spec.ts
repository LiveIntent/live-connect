import { expect, use } from 'chai'
import dirtyChai from 'dirty-chai'
import { removeInvalidPairs } from '../../../src/config-validators/remove-invalid-pairs.js'
import { LocalEventBus } from '../../../src/events/event-bus.js'

use(dirtyChai)

describe('RemoveInvalidPairsTransformer', () => {
  const eventBus = LocalEventBus()
  let errors: Error[] = []

  beforeEach(() => {
    eventBus.on('li_errors', (error) => { errors.push(error as Error) })
    errors = []
  })

  it('should send event and remove distributorId when both appId and distributorId are present', () => {
    const config = {
      appId: 'a-0100',
      distributorId: 'did-9898',
      liveConnectId: '213245'
    }
    const expectedResult = {
      appId: 'a-0100',
      liveConnectId: '213245'
    }
    const result = removeInvalidPairs(config, eventBus)

    expect(result).to.eql(expectedResult)
    expect(errors).to.not.be.empty()
  })

  it('should not modify config if appId and distributorId are not present', () => {
    const config = {
      appId: 'a-0100',
      liveConnectId: '213245',
      globalVarName: 'liQTest'
    }
    const expectedResult = {
      appId: 'a-0100',
      liveConnectId: '213245',
      globalVarName: 'liQTest'
    }
    const result = removeInvalidPairs(config, eventBus)

    expect(result).to.eql(expectedResult)
    expect(errors).to.be.empty()
  })
})
