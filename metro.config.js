const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Le watcher de Metro tourne en boucle infinie si Playwright écrit des
// captures d'échec dans test-results/ pendant que le bundle compile : chaque
// écriture déclenche un redémarrage du bundling, qui échoue à nouveau, qui
// réécrit une capture, etc. Exclues du watcher, pas seulement de git.
config.resolver.blockList = [
  /test-results\/.*/,
  /playwright-report\/.*/,
]

module.exports = withNativeWind(config, { input: './global.css' })
