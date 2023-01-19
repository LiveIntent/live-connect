import Cookies, { CookiesStatic } from 'js-cookie'
import { ExternalStorageHandler, EventBus } from '../../../src/types'

export class TestStorageHandler implements ExternalStorageHandler {
  private eventBus: EventBus
  private _localStorageIsEnabled?: boolean
  private cookies: CookiesStatic<string>

  constructor (eventBus: EventBus) {
    this.eventBus = eventBus
    this._localStorageIsEnabled = null

    this.cookies = Cookies.withConverter({
      read: function (value, name) {
        try {
          const result = Cookies.converter.read(value, name)
          if (result === undefined) {
            return null
          } else {
            return result
          }
        } catch (e) {
          eventBus.emitErrorWithMessage('CookieReadError', `Failed reading cookie ${name}`, e)
          return null
        }
      }
    })
  }

  getCookie (key: string): string | null {
    const result = this.cookies.get(key)
    if (result === undefined) {
      return null
    }
    return result
  }

  findSimilarCookies (substring: string): string[] {
    try {
      const allCookies = this.cookies.get()
      return Object.keys(allCookies).filter(key => key.indexOf(substring) >= 0 && allCookies[key] !== null).map(key => allCookies[key])
    } catch (e) {
      this.eventBus.emitErrorWithMessage('CookieFindSimilarInJar', 'Failed fetching from a cookie jar', e)
      return []
    }
  }

  setCookie (key: string, value: string, expires?: Date, sameSite?: string, domain?: string): void {
    if (expires) {
      let expiresDate: Date
      if (typeof expires === 'string') {
        expiresDate = new Date(expires)
      } else if (typeof expires === 'number') {
        expiresDate = new Date(Date.now() + expires * 864e5)
      } else {
        expiresDate = expires
      }
      this.cookies.set(key, value, { domain: domain, expires: expiresDate, samesite: sameSite })
    } else {
      this.cookies.set(key, value, { domain: domain, samesite: sameSite })
    }
  }

  localStorageIsEnabled () {
    if (this._localStorageIsEnabled == null) {
      this._localStorageIsEnabled = this.checkLocalStorage()
    }
    return this._localStorageIsEnabled
  }

  getDataFromLocalStorage (key: string): string | null {
    if (this.localStorageIsEnabled()) {
      return window.localStorage.getItem(key)
    } else {
      return null
    }
  }

  setDataInLocalStorage (key: string, value: string): void {
    if (this.localStorageIsEnabled()) {
      window.localStorage.setItem(key, value)
    }
  }

  removeDataFromLocalStorage (key: string): void {
    if (this.localStorageIsEnabled()) {
      window.localStorage.removeItem(key)
    }
  }

  private checkLocalStorage () {
    let enabled = false
    try {
      if (window && window.localStorage) {
        const key = Math.random().toString()
        window.localStorage.setItem(key, key)
        enabled = window.localStorage.getItem(key) === key
        window.localStorage.removeItem(key)
      }
    } catch (e) {
      this.eventBus.emitError('LSCheckError', e)
    }
    return enabled
  }
}
