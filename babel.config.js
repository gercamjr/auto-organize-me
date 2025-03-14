module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@contexts': './src/contexts',
            '@types': './src/types',
            '@database': './src/database',
            '@assets': './src/assets',
          },
        },
      ],
    ],
  }
}
