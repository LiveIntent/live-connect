import { isEmail } from '../utils/email'
import { trim } from 'live-connect-common'

export const MASK = '*********'

export function replacer(key: unknown, value: string): string {
  return (typeof value === 'string' && isEmail(trim(value))) ? MASK : value
}
