const WAIT_UNTIL_TIMEOUT_MILLIS = 1000
const WAIT_UNTIL_INTERVAL = 30

export function sendEvent (event, expectedRequests, server) {
  const json = JSON.stringify(event)
  try {
    browser.execute(`window.liQ = window.liQ || [];window.liQ.push(${json})`)
    waitForRequests(expectedRequests, server)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
  }
}

export function waitForRequests (expectedRequests, server) {
  try {
    browser.waitUntil(() => {
      return server.getHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForRequests timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
  }
}

export function waitForBakerRequests (expectedRequests, server) {
  try {
    browser.waitUntil(() => {
      return server.getBakerHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'waitForBakerRequests timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getBakerHistory().length, expectedRequests)
  }
}

export function resolveIdentity (expectedRequests, server) {
  try {
    browser.execute('window.liQ = window.liQ || [];window.liQ.resolve(function(response) { document.getElementById("idex").innerHTML = JSON.stringify(response); })')
    browser.waitUntil(() => {
      return server.getIdexHistory().length === expectedRequests
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'resolveIdentity timed out', WAIT_UNTIL_INTERVAL)
  } catch (e) {
    console.error(e, server.getHistory().length, expectedRequests)
  }
}

export function fetchResolvedIdentity () {
  try {
    browser.waitUntil(() => {
      console.log($('#idex').getText())
      return $('#idex').getText() !== 'None'
    }, WAIT_UNTIL_TIMEOUT_MILLIS, 'fetchResolvedIdentity timed out', WAIT_UNTIL_INTERVAL)
    return $('#idex').getText()
  } catch (e) {
    console.error('Error', e)
    return 'None'
  }
}

export function probeLS () {
  try {
    return browser.execute(() => {
      try {
        var key = 'x'
        window.localStorage.removeItem(key)
        window.localStorage.setItem(key, key)
        return window.localStorage.getItem(key) === key
      } catch (e) {
        return false
      }
    })
  } catch (e) {
    console.error('Error while probing LS', e)
    return false
  }
}

export function deleteAllCookies () {
  try {
    browser.execute(() => {
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
      } catch (ex) {
        console.error(ex)
      }
    })
  } catch (e) {
    console.error('Error while Deleting all cookies', e)
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
