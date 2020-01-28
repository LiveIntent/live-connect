/**
 * @typedef {Object} StorageStrategy
 * @type {{cookie: string, localStorage: string, none: string}}
 */
const StorageStrategy = {
  cookie: 'cookie',
  localStorage: 'ls',
  none: 'none'
}

export { StorageStrategy }
