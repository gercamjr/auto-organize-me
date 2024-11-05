module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'], // The root directory to resolve modules from
          alias: {
            '@': '.',
          },
        },
      ],
    ],
  }
}
