module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-reanimated/plugin',
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
      }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
}; 