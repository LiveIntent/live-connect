import { expect, use } from 'chai'
import { urlParams, urlParamsWithPredicate } from '../../../src/utils/url'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

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
  'array=c'
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

  it('should not fail when there are some invalid query values that are not part of the predicate', () => {
    const params = urlParamsWithPredicate('https://www.bluenile.com/hk/zh/diamonds?gclid=CjwKCAiAh9q&click_id=12&utm_source=google&utm_campaign=Google_%7C_GC_%7C_HK_%7C_Traditional_Chinese_%7C_Text_%7C_Non-Brand_%7C_ENG_%7C_NA_%7C_Engagement_%7&utm_content=Diamonds%3A_Price&utm_term=%E4%B8%80+%E5%85%8B%E6%&name=%37', (name) => name === 'name')
    expect(params.gclid).to.eq('CjwKCAiAh9q')
    expect(params.click_id).to.eq(12)
    expect(params.utm_source).to.eq('google')
    expect(params.utm_campaign).to.eq('Google_%7C_GC_%7C_HK_%7C_Traditional_Chinese_%7C_Text_%7C_Non-Brand_%7C_ENG_%7C_NA_%7C_Engagement_%7')
    expect(params.utm_content).to.eq('Diamonds%3A_Price')
    expect(params.name).to.eq(7)
  })
})
