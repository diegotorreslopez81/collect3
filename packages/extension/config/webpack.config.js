'use strict';

const { merge } = require('webpack-merge');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (_, argv) =>
  merge(common, {
    entry: {
      popup: PATHS.src + '/popup.ts',
      contentScript: PATHS.src + '/contentScript.ts',
      preview: PATHS.src + '/pages/preview/preview.ts',
      articles: PATHS.src + '/pages/articles/articles.ts',
      storage: PATHS.src + '/pages/storage/storagePage.ts',
      share: PATHS.src + '/pages/share/share.ts',
      background: PATHS.src + '/background.ts',
      received: PATHS.src + '/pages/received/received.ts',
    },
    plugins: [
      new Dotenv({
        path: PATHS.src + '/../.env',
        safe: true,
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
