const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Metro 0.83+ active unstable_enablePackageExports par défaut avec conditionNames:[].
// Sans conditions définies, les packages dont les exports n'ont pas de condition
// 'react-native' (ex: react-i18next, i18next) ne peuvent pas être résolus.
// On ajoute les conditions standard CJS pour couvrir ces packages.
config.resolver.unstable_conditionNames = ['require', 'default']

module.exports = withNativeWind(config, { input: './global.css' })
