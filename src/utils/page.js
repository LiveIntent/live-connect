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
    const levels = _getLevels()
    return {
      referrer: _getReferrer(levels),
      pageUrl: _getPageUrl(levels)
    }
  } catch (e) {
    return {
      pageUrl: undefined,
      referrer: undefined
    }
  }
}

function _getLevels () {
  const levels = _windowsTopDown()
  const ancestors = _getAncestorOrigins()

  if (ancestors) {
    for (let i = 0; i < ancestors.length; i++) {
      levels[i].ancestor = ancestors[i]
    }
  }
  return levels
}

function _windowsTopDown () {
  const windows = []
  let currentWindow
  do {
    try {
      currentWindow = currentWindow ? currentWindow.parent : window
      try {
        windows.push({
          referrer: currentWindow.document.referrer,
          location: currentWindow.location.href
        })
      } catch (e) {
        windows.push({
          referrer: null,
          location: null
        })
      }
    } catch (e) {
      windows.push({
        referrer: null,
        location: null
      })
      return windows
    }
  } while (currentWindow !== window.top)
  return windows
}

/**
 * Returns a read-only array of hostnames for all the parent frames.
 * win.location.ancestorOrigins is only supported in webkit browsers. For non-webkit browsers it will return undefined.
 * @returns {(undefined|string[])} Ancestor origins or undefined
 */
function _getAncestorOrigins () {
  try {
    return window.location.ancestorOrigins
  } catch (e) {
    return undefined
  }
}

function _getReferrer (levels) {
  let detectedReferer = null

  for (let i = levels.length - 1; i >= 0 && !detectedReferer; i--) {
    const currentWindow = levels[i]
    if (currentWindow.referrer) detectedReferer = currentWindow.referrer
    // else if (currentWindow.location) detectedReferer = currentWindow.location
    // else if (currentWindow.ancestor) detectedReferer = currentWindow.ancestor
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
      const nestedReferrer = nestedWindow.referrer
      // const nestedAncestor = nestedWindow.ancestor

      if (nestedReferrer) detectedPageUrl = nestedReferrer
      // else if (nestedAncestor) detectedPageUrl = nestedAncestor
    }
  }
  return detectedPageUrl
}
