import { base64UrlEncode } from '../utils/b64'
import { findAndReplaceRawEmails } from '../utils/email'

/**
 * @return {string}
 */
export function loadedDomain () {
  return (document.domain || (document.location && document.location.host)) || (window && window.location && window.location.host) || 'localhost'
}

/**
 * @return {string|undefined}
 */
export function getReferrer (win = window) {
  return _safeGet(() => win.top.document.referrer)
}

/**
 * @return {string|undefined}
 */
export function getPage (win = window) {
  const ancestorOrigins = _safeGet(() => win.location.ancestorOrigins) || {}

  const windows = []
  let currentWindow = win
  while (currentWindow !== top) {
    windows.push(currentWindow)
    currentWindow = currentWindow.parent
  }
  windows.push(currentWindow)

  let detectedPageUrl
  for (let i = windows.length - 1; i >= 0 && !detectedPageUrl; i--) {
    detectedPageUrl = _safeGet(() => windows[i].location.href)
    if (i !== 0) {
      if (!detectedPageUrl) detectedPageUrl = _safeGet(() => windows[i - 1].document.referrer)
      if (!detectedPageUrl) detectedPageUrl = ancestorOrigins[i - 1]
    }
  }

  return detectedPageUrl
}

/**
 * @return {string|undefined}
 */
export function getContextElements (contextSelectors, contextElementsLength, win = window) {
  console.log('contextSelectors: ' + contextSelectors + 'contextElementsLength' + contextElementsLength)
  var collectedElements = _collectElementsText(contextSelectors, win)
  var elementsReplaceRawEmails = findAndReplaceRawEmails(collectedElements).stringWithoutRawEmails
  var collectedElementsTrucated = elementsReplaceRawEmails.slice(0, contextElementsLength)
  return base64UrlEncode(collectedElementsTrucated)
}

function _collectElementsText (contextSelectors, win = window) {
  var collectedElements = win.document.querySelectorAll(contextSelectors)
  return Array.prototype.map.call(collectedElements, function (e) { return e.textContent }).join()
}

function _safeGet (getter) {
  try {
    return getter()
  } catch (e) {
    return undefined
  }
}
