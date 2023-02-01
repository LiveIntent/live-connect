import md5 from 'tiny-hashes/md5'
import sha1 from 'tiny-hashes/sha1'
import sha256 from 'tiny-hashes/sha256'
import { HashedEmail } from '../types'
import { trim } from './types'

const hashLikeRegex = () => /(\s+)?[a-f0-9]{32,64}(\s+)?/gi

const lengthToHashType: Map<number, string> = new Map([[32, 'md5'], [40, 'sha1'], [64, 'sha256']])

export function isHash(hash: string): boolean {
  const extractedHash = extractHashValue(hash)
  return !!extractedHash && lengthToHashType.has(extractedHash.length)
}

export function extractHashValue(s: string): string | null {
  const result = s.match(hashLikeRegex())
  return result && result.map(trim)[0]
}

export function hashEmail(email: string): HashedEmail {
  const lowerCasedEmail = email.toLowerCase()
  return {
    md5: md5(lowerCasedEmail),
    sha1: sha1(lowerCasedEmail),
    sha256: sha256(lowerCasedEmail)
  }
}

export function domainHash(domain: string, limit = 12): string {
  return sha1(domain.replace(/^\./, '')).substring(0, limit)
}
