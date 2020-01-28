import { expect } from 'chai'
import * as typeUtils from '../../../src/utils/types'

describe('StringUtils', () => {

  it('should return a string if the argument is a number', function () {
    const result = typeUtils.safeToString(22)
    expect(result).to.eql('22')
  })

  it('should return a trimmed string', function () {
    const result = typeUtils.trim(' ssd    ')
    expect(result).to.eql('ssd')
  })

  it('should return a trimmed string even if the value is not a string', function () {
    const result = typeUtils.trim(2)
    expect(result).to.eql('2')
  })

  it('should return a json if the argument is an object', function () {
    const result = typeUtils.safeToString({
      a: '123',
      b: 321
    })

    expect(result).to.eql('{"a":"123","b":321}')
  })

  it('should return correct values when checking string equality while ignoring case', function () {
    expect(typeUtils.strEqualsIgnoreCase(null, undefined)).to.be.false
    expect(typeUtils.strEqualsIgnoreCase(undefined, '')).to.be.false
    expect(typeUtils.strEqualsIgnoreCase('null', 'undefined')).to.be.false
    expect(typeUtils.strEqualsIgnoreCase('x', 'y')).to.be.false
    expect(typeUtils.strEqualsIgnoreCase('X', 'Y')).to.be.false
    expect(typeUtils.strEqualsIgnoreCase('X', 'x')).to.be.true
    expect(typeUtils.strEqualsIgnoreCase('  X  ', '  x  ')).to.be.true
  })

  it('should return correct isObject checks', function () {
    expect(typeUtils.isObject('.')).to.be.false
    expect(typeUtils.isObject([])).to.be.false
    expect(typeUtils.isObject(null)).to.be.false
    expect(typeUtils.isObject(undefined)).to.be.false
    expect(typeUtils.isObject(123)).to.be.false
  })

})
