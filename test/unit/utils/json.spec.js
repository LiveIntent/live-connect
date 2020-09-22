import { expect } from 'chai'
import { safeParseJson } from '../../../src/utils/json'

describe('Json Utils', () => {
  it('should parse a valid json', function () {
    const result = safeParseJson('{ "bakers": ["https://baker1.com/baker", "https://baker2.com/baker"]}')

    expect(result).to.eql({
      bakers: ['https://baker1.com/baker', 'https://baker2.com/baker']
    })
  })

  it('should return an empty json when the string is not a valid json', function () {
    const result = safeParseJson('strudel')

    expect(result).to.eql({})
  })
})
