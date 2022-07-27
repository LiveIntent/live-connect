
export default function ConfigManager () {
  this.seenConfigs = []
}

export function hasPriorityOver (configA, configB) {
  return qualifiedConfig(configA) && !qualifiedConfig(configB)
}

export function qualifiedConfig (config) {
  return !!config.appId
}

ConfigManager.prototype = {
  push: function (config) {
    this.seenConfigs.push(config)
  },

  configs: function () {
    return this.seenConfigs
  }
}
