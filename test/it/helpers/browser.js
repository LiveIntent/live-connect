import { assert } from 'chai'

const WAIT_UNTIL_TIMEOUT_MILLIS = 30000
const WAIT_UNTIL_INTERVAL = 500

export async function getText (selector) {
  var text
  await browser.waitUntil(
    async () => {
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
    },
    {
      timeout: WAIT_UNTIL_TIMEOUT_MILLIS,
      timeoutMsg: 'getText timed out',
      interval: WAIT_UNTIL_INTERVAL
    }
  )
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
  await browser.waitUntil(
    () => {
      return server.getHistory().length >= expectedRequests
    },
    {
      timeout: WAIT_UNTIL_TIMEOUT_MILLIS,
      timeoutMsg: 'waitForRequests timed out',
      interval: WAIT_UNTIL_INTERVAL
    }
  )
  console.info('Done waiting for requests')
}

export async function waitForBakerRequests (expectedRequests, server) {
  console.info(`Waiting for ${expectedRequests} baker requests`)
  await browser.waitUntil(
    () => {
      return server.getBakerHistory().length >= expectedRequests
    },
    {
      timeout: WAIT_UNTIL_TIMEOUT_MILLIS,
      timeoutMsg: 'waitForBakerRequests timed out',
      interval: WAIT_UNTIL_INTERVAL
    }
  )
  console.info('Done waiting for baker requests')
}

export async function resolveIdentity (expectedRequests, server) {
  const error = await browser.execute(function (done) {
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
    await browser.waitUntil(
      () => {
        return server.getIdexHistory().length >= expectedRequests
      },
      {
        timeout: WAIT_UNTIL_TIMEOUT_MILLIS,
        timeoutMsg: 'resolveIdentity timed out',
        interval: WAIT_UNTIL_INTERVAL
      }
    )
    console.info('Done waiting for idex requests')
  }
}

export async function fetchResolvedIdentity () {
  console.info('Waiting for identity to resolve')
  var text = 'None'
  await browser.waitUntil(
    async () => {
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
    },
    {
      timeout: WAIT_UNTIL_TIMEOUT_MILLIS,
      timeoutMsg: 'fetchResolvedIdentity timed out',
      interval: WAIT_UNTIL_INTERVAL
    }
  )
  console.info('Done waiting for identity to resolve')
  return text
}

export async function probeLS () {
  const result = await browser.execute(function () {
    const key = '__live-connect-localstorage-probe-test'
    var enabled = false
    var error = null
    try {
      if (window && window.localStorage) {
        window.localStorage.setItem(key, key)
        enabled = window.localStorage.getItem(key) === key
        window.localStorage.removeItem(key)
      }
    } catch (e) {
      error = e
    }
    return [error, enabled]
  })
  const error = result[0]
  const enabled = result[1]
  if (error) {
    console.warn(`Error while probing localstorage: ${JSON.stringify(error)}`)
  }
  if (!enabled) {
    console.warn('localstorage not supported')
  }
  return enabled
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
  return browser.capabilities.browserName === 'safari' &&
    (browser.capabilities.realMobile || browser.capabilities.real_mobile)
}

export function isMobileSafari14OrNewer () {
  return browser.capabilities.browserName === 'safari' &&
    (
      (browser.capabilities.browserVersion && parseInt(browser.capabilities.browserVersion.substring(0, 2)) >= 14) ||
      (browser.capabilities.version && parseInt(browser.capabilities.version.substring(0, 2)) >= 14)
    ) &&
    (browser.capabilities.realMobile || browser.capabilities.real_mobile)
}

export function isIE () {
  return browser.capabilities.browserName === 'internet explorer'
}

export function isFirefox () {
  return browser.capabilities.browserName === 'firefox'
}

export function isFirefoxAfter86 () {
  return browser.capabilities.browserName === 'firefox' &&
    (
      (browser.capabilities.browserVersion === 'latest') ||
      (browser.capabilities.browserVersion && parseInt(browser.capabilities.browserVersion.split('.')[0]) > 86) ||
      (browser.capabilities.version && parseInt(browser.capabilities.version.split('.')[0]) > 86)
    )
}
