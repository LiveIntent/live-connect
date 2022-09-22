import { base64UrlEncode } from './b64'
import { replaceEmailsWithHashes } from './email'

/**
 * @return {string}
 */
export function loadedDomain (): string {
  return (
    document.domain ||
    (document.location && document.location.host) ||
    (window && window.location && window.location.host) ||
    'localhost'
  )
}

/**
 * @return {string|undefined}
 */
export function getReferrer (win: Window = window): string | undefined {
  return _safeGet(() => win.top.document.referrer)
}

/**
 * @return {string|undefined}
 */
export function getPage (win: Window = window): string | undefined {
  const ancestorOrigins = _safeGet(() => win.location.ancestorOrigins) || {}

  const windows = []
  let currentWindow = win
  while (currentWindow !== top) {
    windows.push(currentWindow)
    currentWindow = currentWindow.parent
  }
  windows.push(currentWindow)

  let detectedPageUrl: string
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
export function getContextElements (privacyMode: boolean, contextSelectors: string, contextElementsLength: number): string {
  if (privacyMode || !contextSelectors || contextSelectors === '' || !contextElementsLength) {
    return ''
  } else {
    const collectedElements = _collectElementsText(contextSelectors, contextElementsLength)
    return base64UrlEncode(collectedElements)
  }
}

function _collectElementsText (contextSelectors: string, contextElementsLength: number): string {
  const collectedElements = window.document.querySelectorAll(contextSelectors)
  let collectedString = ''
  for (let i = 0; i < collectedElements.length; i++) {
    const nextElement = replaceEmailsWithHashes(collectedElements[i].outerHTML).stringWithoutRawEmails
    const maybeCollectedString = collectedString + nextElement
    if (encodedByteCount(maybeCollectedString) <= contextElementsLength) collectedString = maybeCollectedString
    else return collectedString
  }
  return collectedString
}

function encodedByteCount (s: string): number {
  // From: https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
  const utf8Bytelength = encodeURI(s).split(/%..|./).length - 1
  const base64EncodedLength = 4 * Math.ceil(utf8Bytelength / 3.0)
  return base64EncodedLength
}

function _safeGet <A> (getter: () => A): A {
  try {
    return getter()
  } catch (e) {
    return undefined
  }
}
