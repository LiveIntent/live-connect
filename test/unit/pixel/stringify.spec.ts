import { replacer, MASK } from '../../../src/pixel/stringify.js'
import { expect, use } from 'chai'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('Stringify', () => {
  it('should replace email like string with a mask using plain  @ symbol', () => {
    const pixelData = { anyField: 'me@liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask using url encoded @ symbol', () => {
    const pixelData = { anyField: 'me%40liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should not replace string with an @ symbol if it is not an email', () => {
    const pixelData = { anyField: 'me@you' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: 'me@you'
    })
  })

  it('should replace email like string with a mask, with padding before', () => {
    const pixelData = { anyField: '     me%40liveintent.com' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask, with padding after', () => {
    const pixelData = { anyField: 'me%40liveintent.com      ' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })

  it('should replace email like string with a mask, when the value contains random chars', () => {
    const pixelData = { anyField: '"me%40liveintent.com      "' }
    const result = JSON.stringify(pixelData, replacer)
    expect(JSON.parse(result)).to.eql({
      anyField: MASK
    })
  })
})
