const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  transformer: {
    ...config.transformer,
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
}; 