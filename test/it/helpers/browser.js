import { assert } from 'chai'

const WAIT_UNTIL_TIMEOUT_MILLIS = 180000
const WAIT_UNTIL_INTERVAL = 300

export async function getText (selector) {
  var text
  await browser.waitUntil(async () => {
    try {
      const element = await $(selector)
      if (element.elementId) {
        text = await element.getText()
        return true
      } else {
        return false
      }
    } catch {
      return false
    }
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'getText timed out', WAIT_UNTIL_INTERVAL)
  return text
}

export async function click (selector) {
  return $(selector).then(e => e.click())
}

export async function sendEvent (event, expectedRequests, server) {
  const error = await browser.execute(function (event) {
    try {
      window.liQ = window.liQ || []
      window.liQ.push(event)
      return null
    } catch (e) {
      return e
    }
  }, event)
  if (error) {
    assert.fail(`Failed sending event: ${error}`)
  }
  await waitForRequests(expectedRequests, server)
}

export async function waitForRequests (expectedRequests, server) {
  console.info(`Waiting for ${expectedRequests} requests`)
  await browser.waitUntil(() => {
    return server.getHistory().length === expectedRequests
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForRequests timed out', WAIT_UNTIL_INTERVAL)
  console.info('Done waiting for requests')
}

export async function waitForBakerRequests (expectedRequests, server) {
  console.info(`Waiting for ${expectedRequests} baker requests`)
  await browser.waitUntil(() => {
    return server.getBakerHistory().length === expectedRequests
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForBakerRequests timed out', WAIT_UNTIL_INTERVAL)
  console.info('Done waiting for baker requests')
}

export async function resolveIdentity (expectedRequests, server) {
  const error = await browser.execute(function () {
    try {
      window.liQ = window.liQ || []
      window.liQ.resolve(function (response) {
        document.getElementById('idex').innerHTML = JSON.stringify(response)
      })
      return null
    } catch (e) {
      return e
    }
  })
  if (error) {
    assert.fail(`Failed resolving identity: ${error}`)
  } else {
    console.info(`Waiting for ${expectedRequests} idex requests`)
    await browser.waitUntil(() => {
      return server.getIdexHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'resolveIdentity timed out', WAIT_UNTIL_INTERVAL)
    console.info('Done waiting for idex requests')
  }
}

export async function fetchResolvedIdentity () {
  console.info('Waiting for identity to resolve')
  var text = 'None'
  await browser.waitUntil(async () => {
    try {
      const idex = await $('#idex')
      if (idex.elementId) {
        text = await idex.getText()
        return text !== 'None'
      } else {
        return false
      }
    } catch {
      return false
    }
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'fetchResolvedIdentity timed out', WAIT_UNTIL_INTERVAL)
  console.info('Done waiting for identity to resolve')
  return text
}

export async function probeLS () {
  const result = await browser.execute(function () {
    try {
      const key = 'x'
      window.localStorage.removeItem(key)
      window.localStorage.setItem(key, key)
      return window.localStorage.getItem(key) === key
    } catch (e) {
      return false
    }
  })
  if (!result) {
    console.warn('localstorage not supported')
  }
  return result
}

export async function deleteAllCookies () {
  const error = await browser.execute(function () {
    try {
      const cookies = document.cookie.split('; ')
      for (let c = 0; c < cookies.length; c++) {
        const d = window.location.hostname.split('.')
        while (d.length > 0) {
          const cookieBase = encodeURIComponent(cookies[c].split(';')[0].split('=')[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path='
          const p = location.pathname.split('/')
          document.cookie = cookieBase + '/'
          while (p.length > 0) {
            document.cookie = cookieBase + p.join('/')
            p.pop()
          }
          d.shift()
        }
      }
      return null
    } catch (e) {
      return e
    }
  })
  if (error) {
    console.error(`failed cleaning cookies: ${error}`)
  }
}

export function isMobileSafari () {
  return browser.capabilities.browserName === 'safari' && browser.capabilities.real_mobile
}

export function isMobileSafari14OrNewer () {
  return browser.capabilities.browserName === 'safari' &&
    parseInt(browser.capabilities.version.substring(0, 2)) >= 14 &&
    browser.capabilities.real_mobile
}

export function isIE () {
  return browser.capabilities.browserName === 'internet explorer'
}

export function isFirefox () {
  return browser.capabilities.browserName === 'firefox'
}

export function isFirefoxAfter86 () {
  return browser.capabilities.browserName === 'firefox' &&
    parseInt(browser.capabilities.browserVersion.substring(0, 2)) > 86
}
