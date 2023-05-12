import { trim } from 'live-connect-common'
import { hashEmail } from './hash'
import { HashedEmail } from '../types'

const emailRegex = () => /\S+(@|%40)\S+\.\S+/

export function isEmail(s: string): boolean {
  return emailRegex().test(s)
}

export function containsEmailField(s: string): boolean {
  return emailRegex().test(s)
}

export function extractEmail(s: string): string | null {
  const result = s.match(emailRegex())
  return result && result.map(trim)[0]
}

export function listEmailsInString(s: string): string[] {
  const result = []
  // eslint-disable-next-line
  const emailLikeRegex = `([\\w\\d.+-]+(@|%40)[\\w\\d-]+.[\\w\\d.-]+)`
  const multipleEmailLikeRegex = new RegExp(emailLikeRegex, 'g')
  let current = multipleEmailLikeRegex.exec(s)
  while (current) {
    result.push(trim(current[1]))
    current = multipleEmailLikeRegex.exec(s)
  }
  return result
}

export function replaceEmailsWithHashes(originalString: string): { hashesFromOriginalString: HashedEmail[]; stringWithoutRawEmails: string } {
  return listEmailsInString(originalString)
    .reduce(({ stringWithoutRawEmails, hashesFromOriginalString }, email) => {
      const hashes = hashEmail(email)
      return {
        stringWithoutRawEmails: stringWithoutRawEmails.replace(email, hashes.md5),
        hashesFromOriginalString: [...hashesFromOriginalString, hashes]
      }
    }, {
      stringWithoutRawEmails: originalString,
      hashesFromOriginalString: [] as HashedEmail[]
    })
}
