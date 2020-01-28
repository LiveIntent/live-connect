import { replacer, MASK } from '../../../src/pixel/stringify'
import { assert, expect } from 'chai'

describe('Stringify', () => {
  it('should replace email like string with a mask using plain  @ symbol', function () {
    const pixelData = { anyField: 'me@liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask using url encoded @ symbol', function () {
    const pixelData = { anyField: 'me%40liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should not replace string with an @ symbol if it is not an email', function () {
    const pixelData = { anyField: 'me@you' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: 'me@you'
    })
  })

  it('should replace email like string with a mask, with padding before', function () {
    const pixelData = { anyField: '     me%40liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask, with padding after', function () {
    const pixelData = { anyField: 'me%40liveintent.com      ' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask, when the value contains random chars', function () {
    const pixelData = { anyField: '"me%40liveintent.com      "' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })
})
