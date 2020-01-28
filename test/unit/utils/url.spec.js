import { expect } from 'chai'
import { urlParams } from '../../../src/utils/url'

const elements = [
  'array=a',
  'array[]=b',
  'boolean=false',
  'one=steve',
  'number=1234',
  'numeric=1234',
  'number=22.55',
  'null=undefined',
  'undefined=null',
  'novalue',
  'array=c',
].join('&')

const params = urlParams(`http://localhost:80/base/path/resource?${elements}`)

describe('UrlUtils', () => {

  it('should match params and types', () => {
    expect(params.one).to.eq('steve')
    expect(params.numeric).to.eq(1234)
  })

  it('should ignore undefined & nulls', () => {
    expect(params.null).to.eq(null)
    expect(params.undefined).to.eq(null)
  })

  it('should parse boolean values', () => {
    expect(params.boolean).to.eq(false)
  })

  it('should parse params without values as boolean', () => {
    expect(params.novalue).to.eq(true)
  })

  it('should parse multiple values as arrays', () => {
    expect(params.number).to.deep.equal([1234, 22.55])
  })

  it('should parse array values', () => {
    expect(params.array).to.deep.equal(['a', 'b', 'c'])
  })
})
