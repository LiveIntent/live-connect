import { assert } from 'chai'

const WAIT_UNTIL_TIMEOUT_MILLIS = 90000
const WAIT_UNTIL_INTERVAL = 600

export async function getText (selector) {
  var text
  const resolved = await browser.waitUntil(async () => {
    const element = await $(selector)
    if (element.elementId) {
      text = await element.getText()
      return true
    } else {
      return false
    }
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'getText timed out', WAIT_UNTIL_INTERVAL)
  if (resolved) {
    return text
  } else {
    console.error('failed getting text for selector', selector)
    assert.fail('resolving failed')
  }
}

export async function click (selector) {
  return await $(selector).then(e => e.click())
}

export async function sendEvent (event, expectedRequests, server) {
  const json = JSON.stringify(event)
  try {
    await browser.executeAsync(function (json, done) {
      window.liQ = window.liQ || []
      window.liQ.push(json)
      done(true)
    }, json)
    await waitForRequests(expectedRequests, server)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
    assert.fail(e)
  }
}

export async function waitForRequests (expectedRequests, server) {
  try {
    await browser.waitUntil(() => {
      return server.getHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForRequests timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
    assert.fail(e)
  }
}

export async function waitForBakerRequests (expectedRequests, server) {
  try {
    await browser.waitUntil(() => {
      return server.getBakerHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForBakerRequests timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getBakerHistory().length, expectedRequests)
    assert.fail(e)
  }
}

export async function resolveIdentity (expectedRequests, server) {
  try {
    await browser.executeAsync(function (done) {
      window.liQ = window.liQ || []
      window.liQ.resolve(function (response) {
        document.getElementById('idex').innerHTML = JSON.stringify(response)
        done(true)
      })
    })
    await browser.waitUntil(() => {
      return server.getIdexHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'resolveIdentity timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
    assert.fail(e)
  }
}

export async function fetchResolvedIdentity () {
  try {
    var text = 'None'
    await browser.waitUntil(async () => {
      const idex = await $('#idex')
      if (idex.elementId) {
        text = await idex.getText()
        return text !== 'None'
      } else {
        return false
      }
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'fetchResolvedIdentity timed out', WAIT_UNTIL_INTERVAL)
    return text
  } catch (e) {
    console.error('Error', e)
    assert.fail(e)
  }
}

export async function probeLS () {
  const result = await browser.executeAsync((done) => {
    try {
      const key = 'x'
      window.localStorage.removeItem(key)
      window.localStorage.setItem(key, key)
      done(window.localStorage.getItem(key) === key)
    } catch (e) {
      done(e)
    }
  })
  console.warn(`localstorage: ${result}`)
  return result
}

export async function deleteAllCookies () {
  return await browser.executeAsync((done) => {
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
      done(true)
    } catch (ex) {
      console.error(ex)
      done(false)
    }
  })
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
