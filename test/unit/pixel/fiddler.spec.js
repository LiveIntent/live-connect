import { expect } from 'chai'
import { fiddle } from '../../../src/pixel/fiddler'
import { hashEmail } from '../../../src/utils/hash'

describe('Fiddler', () => {
  it('should use the providedHash if present', function () {
    const pixelData = {
      eventSource: { email: '75524519292E51AD6F761BAA82D07D76' }
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should use the providedHash if present, ignoring the case of the key', function () {
    const pixelData = {
      eventSource: { eMaIl: '75524519292E51AD6F761BAA82D07D76' }
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should ignore the providedHash if it is not a valid hash', function () {
    const pixelData = {
      eventSource: { email: '75524519292e51ad6f761baa82d07d76aa' }
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(undefined)
  })

  it('should work while ignoring whitespace ', function () {
    const pixelData = {
      eventSource: {
        email: '    75524519292E51AD6F761BAA82D07D76'
      }
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql(['75524519292e51ad6f761baa82d07d76'])
  })

  it('should use the first found hash, even if there are multiple HASH_BEARERS provided', function () {
    const hashes = hashEmail('mookie@gmail.com')
    const pixelData = {
      eventSource: {
        email: hashes.md5,
        hash: hashes.sha1,
        hashedemail: hashes.sha256
      }
    }
    const result = fiddle(pixelData)
    expect(result.hashedEmail).to.eql([hashes.md5])

  })

  it('should hash the plain text email if the providedHash if it is not a valid hash', function () {
    const pixelData = {
      eventSource: {
        emailHash: '75524519292e51ad6f761baa82d07d76aa',
        email: 'mookie@gmail.com'
      }
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should hash the plain text url encoded email as if it contained an @ symbol', function () {
    const pixelData = {
      eventSource: {
        email: 'mookie%40gmail.com'
      }
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should hash the plain text url encoded email as if it contained an @ symbol, ignoring the surrounding mess or case', function () {
    const pixelData = {
      eventSource: {
        email: '"   mOOkie%40gmail.com "'
      }
    }
    const result = fiddle(pixelData)
    const hashes = hashEmail('mookie@gmail.com')
    expect(result.hashedEmail).to.eql([hashes.md5, hashes.sha1, hashes.sha256])
  })

  it('should limit the number of items in the items array, regardless of the case', function () {
    expect(fiddle({
      eventSource: {
        iTeMs: Array.from(Array(50).keys())
      }
    }).eventSource.iTeMs).to.eql(Array.from(Array(10).keys()))

    expect(fiddle({
      eventSource: {
        iTeMIdS: Array.from(Array(20).keys())
      }
    }).eventSource.iTeMIdS).to.eql(Array.from(Array(10).keys()))
  })
})
