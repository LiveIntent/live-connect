import { expect } from 'chai'
import * as hashUtils from '../../../src/utils/hash'

describe('Hashes', () => {

  it('hash an email with a lowerCased value', function () {
    const result = hashUtils.hashEmail('HASH@HASH.COM')
    const test = hashUtils.hashEmail('hash@hash.com')
    expect(test).to.eql(result)
  })

  it('should return true when checking whether a hash really is a hash', function () {
    const test = hashUtils.hashEmail('hash@hash.com')
    expect(hashUtils.isHash(test.md5)).to.be.true
    expect(hashUtils.isHash(test.sha1)).to.be.true
    expect(hashUtils.isHash(test.sha256)).to.be.true
  })

  it('should return true when checking whether a hash with unknown chars around it really is a hash', function () {
    const test = hashUtils.hashEmail('hash@hash.com')
    expect(hashUtils.isHash(` "    "    "   ${test.md5}   "  "  "  " "`)).to.be.true
    expect(hashUtils.isHash(` "    "    "   ${test.sha1}   "  "  "  " "`)).to.be.true
    expect(hashUtils.isHash(` "    "    "   ${test.sha256}   "  "  "  " "`)).to.be.true
  })

  it('should return false when a string does not look like a hash', function () {
    const result = hashUtils.isHash('hash@hash.com')
    expect(result).to.eql(false)
  })

  it('should return the hash without surrounding chars', function () {
    const test = hashUtils.hashEmail('hash@hash.com')
    expect(hashUtils.extractHashValue(` "    "    "   ${test.md5}   "  "  "  " "`)).to.eql(test.md5)
    expect(hashUtils.extractHashValue(` "    "    "   ${test.sha1}   "  "  "  " "`)).to.eql(test.sha1)
    expect(hashUtils.extractHashValue(` "    "    "   ${test.sha256}   "  "  "  " "`)).to.eql(test.sha256)
    expect(hashUtils.extractHashValue(` "  sssa  "    "   ${test.sha256}   "  "  "sad  " "`)).to.eql(test.sha256)
  })

  it('should return the hash even if the string is an array', function () {
    const test = hashUtils.hashEmail('hash@hash.com')
    expect(hashUtils.extractHashValue(`[ " ${test.md5} "]`)).to.eql(test.md5)
  })
})
