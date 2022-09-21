export interface MinimalStorageHandler {
  getCookie: (key: string) => string | null,
  getDataFromLocalStorage: (key: string) => string | null,
  localStorageIsEnabled: () => Boolean
}

export interface StorageHandler extends MinimalStorageHandler {
  get: (key: string) => string | null,
  set: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
  setCookie: (key: string, value: string, expires?: Date, sameSite?: string, domain?: string) => void,
  setDataInLocalStorage: (key: string, value: string) => void,
  removeDataFromLocalStorage: (key: string) => void,
  findSimilarCookies: (substring: string) => string[]
}
