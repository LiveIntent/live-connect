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
  return isIframe() ? window.top.location.href : document.location.href
}

/**
 * @returns {string} hostname of the website if we are in an iFrame
 */
export function parentHostname () {
  const parser = document.createElement('a')
  parser.href = document.referrer
  return parser.hostname
}

/**
 * @return {string}
 */
export function loadedDomain () {
  return (document.domain || (document.location && document.location.host)) || (window && window.location && window.location.host) || 'localhost'
}
