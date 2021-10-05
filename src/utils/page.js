import { base64UrlEncode } from '../utils/b64'
import { replaceEmailsWithHashes, emailLikeNoDoubleQuotesRegex } from '../utils/email'

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
  if (!contextSelectors || contextSelectors === '' || !contextElementsLength) {
    return ''
  } else {
    var collectedElements = _collectElementsText(contextSelectors, contextElementsLength, win)
    return base64UrlEncode(collectedElements)
  }
}

function _collectElementsText (contextSelectors, contextElementsLength, win = window) {
  const collectedElements = win.document.querySelectorAll(contextSelectors)
  var i = 0
  var collectedString = ''
  while (i < collectedElements.length) {
    var nextElement = replaceEmailsWithHashes(collectedElements[i].outerHTML, emailLikeNoDoubleQuotesRegex).stringWithoutRawEmails
    var n = nextElement.length + collectedString.length
    if (4 * Math.ceil(n / 3.0) < contextElementsLength) collectedString = collectedString + nextElement
    else return collectedString
    i++
  }
  return collectedString
}

function _safeGet (getter) {
  try {
    return getter()
  } catch (e) {
    return undefined
  }
}
