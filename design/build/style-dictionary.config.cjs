const StyleDictionary = require('style-dictionary');
module.exports = {
  source: ['../tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: '../../public/css/',
      files: [{
        destination: 'blackroad-tokens.css',
        format: 'css/variables',
        options: { selector: ':root' }
      }]
    },
    ts: {
      transformGroup: 'js',
      buildPath: '../../src/design/',
      files: [{ destination: 'tokens.ts', format: 'javascript/es6' }]
    },
    ios: {
      transformGroup: 'ios',
      buildPath: '../../ios/BlackRoadTokens/',
      files: [{ destination: 'Colors.swift', format: 'ios-swift/class.swift' }]
    },
    android: {
      transformGroup: 'android',
      buildPath: '../../android/app/src/main/res/values/',
      files: [{ destination: 'colors_blackroad.xml', format: 'android/resources' }]
    }
  }
};
