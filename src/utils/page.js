import { base64UrlEncode } from '../utils/b64'
import { replaceEmailsWithHashes } from '../utils/email'

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
export function getContextElements (privacyMode, contextSelectors, contextElementsLength) {
  if (privacyMode || !contextSelectors || contextSelectors === '' || !contextElementsLength) {
    return ''
  } else {
    var collectedElements = _collectElementsText(contextSelectors, contextElementsLength)
    return base64UrlEncode(collectedElements)
  }
}

function _collectElementsText (contextSelectors, contextElementsLength) {
  const collectedElements = window.document.querySelectorAll(contextSelectors)
  var collectedString = ''
  for (let i = 0; i < collectedElements.length; i++) {
    var nextElement = replaceEmailsWithHashes(collectedElements[i].outerHTML).stringWithoutRawEmails
    var maybeCollectedString = collectedString + nextElement
    if (encodedByteCount(maybeCollectedString) <= contextElementsLength) collectedString = maybeCollectedString
    else return collectedString
  }
  return collectedString
}

function encodedByteCount (s) {
  // From: https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
  const utf8Bytelength = encodeURI(s).split(/%..|./).length - 1
  const base64EncodedLength = 4 * Math.ceil(utf8Bytelength / 3.0)
  return base64EncodedLength
}

function _safeGet (getter) {
  try {
    return getter()
  } catch (e) {
    return undefined
  }
}
