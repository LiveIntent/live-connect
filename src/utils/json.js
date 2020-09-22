/**
 * Parses the string as json. If the string is not a valid json, then an empty json is returned.
 * @param json a json string
 * @returns {{}}
 */
export function safeParseJson (json) {
  try {
    return JSON.parse(json)
  } catch (e) {
    return {}
  }
}
