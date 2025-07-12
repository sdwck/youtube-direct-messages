const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    inject: './src/inject.ts',
    app: './src/app.ts',
  },
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  externalsType: 'module',
  externals: {
    '../libs/firebase/firebase-app.js': 'module ../libs/firebase/firebase-app.js',
    '../libs/firebase/firebase-auth.js': 'module ../libs/firebase/firebase-auth.js',
    '../libs/firebase/firebase-firestore.js': 'module ../libs/firebase/firebase-firestore.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [ { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ } ],
  },
  devtool: 'cheap-module-source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'icons', to: 'icons' },
        { from: 'styles', to: 'styles' },
        { from: 'src/libs', to: 'libs' }
      ],
    }),
  ],
};