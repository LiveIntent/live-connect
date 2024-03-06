import { expect, use } from 'chai'
import dirtyChai from 'dirty-chai'
import { QueryBuilder } from '../../src/internal.js'

use(dirtyChai)

describe('QueryBuilder', () => {
  it('should build a query string', () => {
    const query = new QueryBuilder()
    query.add('key', 'value')
    expect(query.toQueryString()).to.be.eq('?key=value')
  })

  it('should build a query string with multiple values', () => {
    const query = new QueryBuilder()
    query.add('key', 'value')
    query.add('key', 'value2')
    expect(query.toQueryString()).to.be.eq('?key=value&key=value2')
  })

  it('should url encode values', () => {
    const query = new QueryBuilder()
    query.add('key', 'value with spaces')
    expect(query.toQueryString()).to.be.eq('?key=value%20with%20spaces')
  })

  it('should url encode keys', () => {
    const query = new QueryBuilder()
    query.add('key with spaces', 'value')
    expect(query.toQueryString()).to.be.eq('?key%20with%20spaces=value')
  })

  it('should url encode keys and values', () => {
    const query = new QueryBuilder()
    query.add('key with spaces', 'value with spaces')
    expect(query.toQueryString()).to.be.eq('?key%20with%20spaces=value%20with%20spaces')
  })

  it('should strip empty keys', () => {
    const query = new QueryBuilder()
    query.add('', 'value')
    expect(query.toQueryString()).to.be.eq('')
  })

  it('should strip empty values', () => {
    const query = new QueryBuilder()
    query.add('key', '')
    expect(query.toQueryString()).to.be.eq('')
  })

  it('should keep empty values when configured', () => {
    const query = new QueryBuilder()
    query.add('key', '', { stripEmpty: false })
    expect(query.toQueryString()).to.be.eq('?key=')
  })

  it('should remove undefined values', () => {
    const query = new QueryBuilder()
    query.addOptional('key', undefined)
    expect(query.toQueryString()).to.be.eq('')
  })

  it('should remove null values', () => {
    const query = new QueryBuilder()
    query.addOptional('key', null)
    expect(query.toQueryString()).to.be.eq('')
  })

  it('should prepend values', () => {
    const query = new QueryBuilder()
    query.add('key', 'value')
    query.add('key', 'value2', { prepend: true })
    expect(query.toQueryString()).to.be.eq('?key=value2&key=value')
  })
})
