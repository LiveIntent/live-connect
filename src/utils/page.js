/**
 * @returns {boolean}
 */
export function isIframe () {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

/**
 * @returns {string}
 * @private
 */
export function getPage () {
  try {
    return isIframe() ? document.referrer : document.location.href
  } catch (e) {
    return document.location.href
  }
}

/**
 * @return {string}
 */
export function loadedDomain () {
  return (document.domain || (document.location && document.location.host)) || (window && window.location && window.location.host) || 'localhost'
}
