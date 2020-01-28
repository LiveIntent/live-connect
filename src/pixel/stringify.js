import { isEmail } from '../utils/email'
import { trim } from '../utils/types'

export const MASK = '*********'

export function replacer (key, value) {
  if (typeof value === 'string' && isEmail(trim(value))) {
    return MASK
  } else {
    return value
  }
}
