import md5 from 'tiny-hashes/md5'
import sha1 from 'tiny-hashes/sha1'
import sha256 from 'tiny-hashes/sha256'
import { trim } from './types'

const hashLikeRegex = () => /(\s+)?[a-f0-9]{32,64}(\s+)?/gi

const lengthToHashType = {
  32: 'md5',
  40: 'sha1',
  64: 'sha256'
}

export interface HashedEmail {
  md5: string,
  sha1: string,
  sha256: string
}

export function isHash (hash: string): boolean {
  const extractedHash = extractHashValue(hash)
  return !!extractedHash && lengthToHashType[extractedHash.length] != null
}

export function extractHashValue (s: string): string {
  const result = s.match(hashLikeRegex())
  return result && result.map(trim)[0]
}

/**
 * @param {string} email
 * @returns {HashedEmail}
 */
export function hashEmail (email: string): HashedEmail {
  const lowerCasedEmail = email.toLowerCase()
  return {
    md5: md5(lowerCasedEmail),
    sha1: sha1(lowerCasedEmail),
    sha256: sha256(lowerCasedEmail)
  }
}

/**
 * @param {string} domain
 * @param limit
 * @returns {string}
 */
export function domainHash (domain: string, limit: number = 12): string {
  return sha1(domain.replace(/^\./, '')).substring(0, limit)
}
