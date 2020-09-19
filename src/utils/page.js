/**
 * @return {string}
 */
export function loadedDomain () {
  return (document.domain || (document.location && document.location.host)) || (window && window.location && window.location.host) || 'localhost'
}

/**
 * @returns {string}
 * @private
 */
export function getPage () {
  try {
    const levels = _windowsTopDown()
    return {
      referrer: _getReferrer(levels.levels),
      pageUrl: _getPageUrl(levels.levels),
      levels: levels.levels,
      ancestors: levels.ancestors
    }
  } catch (e) {
    return {
      pageUrl: undefined,
      referrer: undefined
    }
  }
}

function _windowsTopDown () {
  const ancestorOrigins = _getAncestorOrigins()
  const windows = []

  let currentWindow
  let i = 0
  try {
    do {
      currentWindow = currentWindow ? currentWindow.parent : window
      try {
        windows.push({
          referrer: currentWindow.document.referrer,
          location: currentWindow.location.href,
          ancestorOrigin: ancestorOrigins[i]
        })
      } catch (e) {
        windows.push({
          referrer: null,
          location: null,
          ancestorOrigin: ancestorOrigins[i]
        })
      }
      i++
    } while (currentWindow !== window.top)
  } catch (e) {
    windows.push({
      referrer: null,
      location: null,
      ancestorOrigin: null
    })
  }

  return { levels: windows, ancestors: ancestorOrigins }
}

function _getAncestorOrigins () {
  try {
    return window.location.ancestorOrigins || {}
  } catch (e) {
    return {}
  }
}

function _getReferrer (levels) {
  let detectedReferer = null

  for (let i = levels.length - 1; i >= 0 && !detectedReferer; i--) {
    const currentWindow = levels[i]
    if (currentWindow.referrer) detectedReferer = currentWindow.referrer
    else if (currentWindow.ancestorOrigin) detectedReferer = currentWindow.ancestorOrigin
  }
  return detectedReferer
}

function _getPageUrl (levels) {
  let detectedPageUrl = null

  for (let i = levels.length - 1; i >= 0 && !detectedPageUrl; i--) {
    const currentWindow = levels[i]

    if (currentWindow.location) detectedPageUrl = currentWindow.location
    else if (i !== 0) {
      const nestedWindow = levels[i - 1]
      if (nestedWindow.referrer) detectedPageUrl = nestedWindow.referrer
      else if (nestedWindow.ancestorOrigin) detectedPageUrl = nestedWindow.ancestorOrigin
    }
  }
  return detectedPageUrl
}
