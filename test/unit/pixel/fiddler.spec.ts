import { expect, use } from 'chai'
import { fiddle } from '../../../src/pixel/fiddler.js'
import { hashEmail } from '../../../src/utils/hash.js'
import dirtyChai from 'dirty-chai'

use(dirtyChai)

describe('Fiddler', () => {
  it('should use the providedHash if present', () => {
    const pixelData = { email: '75524519292E51AD6F761BAA82D07D76' }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should use the providedHash if present, ignoring the case of the key', () => {
    const pixelData = { eMaIl: '75524519292E51AD6F761BAA82D07D76' }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should ignore the providedHash if it is not a valid hash', () => {
    const pixelData = { email: '75524519292e51ad6f761baa82d07d76aa' }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(undefined)
  })

  it('should work while ignoring whitespace ', () => {
    const pixelData = { email: '    75524519292E51AD6F761BAA82D07D76' }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should use the first found hash, even if there are multiple HASH_BEARERS provided', () => {
    const hashes = hashEmail('mookie@gmail.com')
    const pixelData = {
      email: hashes.md5,
      hash: hashes.sha1,
      hashedemail: hashes.sha256
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql([hashes.md5])
  })

  it('should hash the plain text email if the providedHash if it is not a valid hash', () => {
    const pixelData = {
      emailHash: '75524519292e51ad6f761baa82d07d76aa',
      email: 'mookie@gmail.com'
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should hash the plain text url encoded email as if it contained an @ symbol', () => {
    const pixelData = {
      email: 'mookie%40gmail.com'
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should hash the plain text url encoded email as if it contained an @ symbol, ignoring the surrounding mess or case', () => {
    const pixelData = {
      email: '"   mOOkie%40gmail.com "'
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should limit the number of items in the items array, regardless of the case - 1', () => {
    const event = { iTeMs: Array.from(Array(50).keys()) }
    const result = fiddle(event)
    expect(result.eventSource!.iTeMs).to.eql(Array.from(Array(10).keys()))
  })

  it('should limit the number of items in the items array, regardless of the case - 2', () => {
    const event = { iTeMIdS: Array.from(Array(20).keys()) }
    const result = fiddle(event)
    expect(result.eventSource!.iTeMIdS).to.eql(Array.from(Array(10).keys()))
  })
})
