import { trim } from './types'
import { hashEmail } from './hash'

const emailRegex = (): RegExp => /\S+(@|%40)\S+\.\S+/

/**
 * @param {string} 
 * @returns {boolean}
 */
export function isEmail(s: string): boolean {
  return emailRegex().test(s)
}

/**
 * @param {string} s
 * @returns {boolean}
 */
export function containsEmailField(s: string): boolean {
  return emailRegex().test(s)
}

export function extractEmail(s: string): string {
  const result = s.match(emailRegex())
  return result && result.map(trim)[0]
}

/**
 * @param {string} s
 * @returns {string[]}
 */
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

/**
 *
 * @param originalString
 * @returns {{hashesFromOriginalString: HashedEmail[], stringWithoutRawEmails: string}}
 */


export function replaceEmailsWithHashes(originalString: string): { stringWithoutRawEmails: string; hashesFromOriginalString: string[] } {
  const emailsInString = listEmailsInString(originalString)
  const hashes = []
  var convertedString = originalString
  for (let i = 0; i < emailsInString.length; i++) {
    const email = emailsInString[i]
    const emailHashes = hashEmail(email)
    convertedString = convertedString.replace(email, emailHashes.md5)
    hashes.push(emailHashes)
  }
  return {
    stringWithoutRawEmails: convertedString,
    hashesFromOriginalString: hashes
  }
}
