import { isEmail } from '../utils/email'
import { trim } from '../utils/types'

export const MASK = '*********'

export function replacer (value: string) {
  return (typeof value === 'string' && isEmail(trim(value))) ? MASK : value
}
