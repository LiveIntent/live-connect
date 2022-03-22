const WAIT_UNTIL_TIMEOUT_MILLIS = 90000
const WAIT_UNTIL_INTERVAL = 600

export async function getText (selector) {
  var text
  await browser.waitUntil(async () => {
    const element = await $(selector)
    if (element.elementId) {
      text = await element.getText()
      return true
    } else {
      return false
    }
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'getText timed out', WAIT_UNTIL_INTERVAL)
  return text
}

export async function click (selector) {
  return $(selector).then(e => e.click())
}

export async function sendEvent (event, expectedRequests, server) {
  await browser.executeAsync(function (json, done) {
    window.liQ = window.liQ || []
    window.liQ.push(json)
    done(true)
  }, event)
  await waitForRequests(expectedRequests, server)
}

export async function waitForRequests (expectedRequests, server) {
  return browser.waitUntil(() => {
    return server.getHistory().length === expectedRequests
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForRequests timed out', WAIT_UNTIL_INTERVAL)
}

export async function waitForBakerRequests (expectedRequests, server) {
  return browser.waitUntil(() => {
    return server.getBakerHistory().length === expectedRequests
  }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForBakerRequests timed out', WAIT_UNTIL_INTERVAL)
}

export async function resolveIdentity (expectedRequests, server) {
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
}

export async function fetchResolvedIdentity () {
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
}

export async function probeLS () {
  const result = await browser.executeAsync(function (done) {
    try {
      const key = 'x'
      window.localStorage.removeItem(key)
      window.localStorage.setItem(key, key)
      done(window.localStorage.getItem(key) === key)
    } catch (e) {
      done(false)
    }
  })
  if (!result) {
    console.warn('localstorage not supported')
  }
  return result
}

export async function deleteAllCookies () {
  return browser.executeAsync(function (done) {
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
