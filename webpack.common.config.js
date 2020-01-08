/* eslint-disable no-sync */

process.env.BROWSERSLIST_CONFIG = './browserslist';

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const nodeObjectHash = require('node-object-hash');
const path = require('path');
const sassdoc = require('sassdoc');
const SaveAssetsJson = require('assets-webpack-plugin');
const webpack = require('webpack');
const WebpackShellPlugin = require('webpack-shell-plugin');

let outputParentDir = path.join(__dirname, 'static', 'dist');
let jsOutput = '[name].bundle.js';
let styleOutput = '[name].bundle.css';
let mediaOutput = '[name].[ext]';
let devtool = 'cheap-module-inline-source-map';

// Override settings if running in production
if (process.env.NODE_ENV === 'production') {
  outputParentDir = path.join(__dirname, 'static', 'dist', 'min');
  jsOutput = '[name].bundle.[chunkhash].min.js';
  styleOutput = '[name].bundle.[chunkhash].min.css';
  mediaOutput = '[name].[hash].[ext]';
  devtool = 'source-map';
}

let assetsJsonPath = process.env.TD_ASSETS_JSON_DIR;
if (!assetsJsonPath) { assetsJsonPath = outputParentDir; }
const outputPath = path.join(outputParentDir, 'assets');
const sassdocPath = path.join(outputParentDir, 'styleguide');

const SassdocPlugin = function () {
  // do nothing
};
const getCSS = function (entry) {
  if (!entry) { return undefined; }
  let css;
  for (const thisPath of entry) {
    if (thisPath.substr(-4) === '.css') {
      css = thisPath;
    }
  }
  return css;
};
SassdocPlugin.prototype.apply = (compiler) => {
  compiler.plugin('after-emit', (compilation, cb) => {
    const statsJSON = compilation.getStats().toJson();
    const css = getCSS(statsJSON.assetsByChunkName.styleguide);
    const json = getCSS(statsJSON.assetsByChunkName.styleguide_json);
    const cssPath = css ? path.join(outputPath, css) : undefined;
    const jsonPath = json ? path.join(outputPath, json) : undefined;
    sassdoc('./static/sass/**/*.scss', {
      dest: sassdocPath,
      theme: 'herman',
      customCSS: cssPath,
      descriptionPath: path.join(__dirname, 'STYLEGUIDE.rst'),
      homepage: '/',
      sassjsonfile: jsonPath,
      templatepath: path.join(__dirname, 'templates'),
      minifiedIcons: '_icons.svg',
      display: { access: ['public'] },
      groups: { undefined: 'general' }
    }).then(() => {
      /* eslint-disable no-console */
      console.log('Generated Sassdoc documentation.');
      cb();
    }, (err) => {
      console.error(err);
      cb();
      /* eslint-enable no-console */
    });
  });
};


module.exports = {
  // context for entry points
  context: path.join(__dirname, 'static', 'js'),
  // define all the entry point bundles
  entry: {
    app: './init.js',
    jquery: ['jquery'],
    backbone: [ 'backbone', 'backbone.marionette' ],
    raven: './raven.js',
    app_styles: ['color_seasons.scss'],
    styleguide: ['styleguide.scss'],
    styleguide_json: ['styleguide_json.scss']
  },
  output: {
    path: outputPath,
    publicPath: '/assets/',
    filename: jsOutput
  },
  resolve: {
    // where to look for "required" modules
    modules: [
      'static/js',
      'templates',
      'sass',
      'static',
      'node_modules'
    ],
    alias: {
      nunjucks: 'nunjucks/browser/nunjucks-slim'
    }
  },
  resolveLoader: {
    alias: { sassjson: path.join(__dirname, 'sass-json-loader') }
  },
  plugins: [
    // ignore flycheck and Emacs special files when watching
    new webpack.WatchIgnorePlugin([
      /flycheck_/,
      /\.#/,
      /#$/
    ]),
    // make jquery accessible in all modules that use it
    new webpack.ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'root.jQuery': 'jquery'
    }),
    new webpack.LoaderOptionsPlugin({
      debug: process.env.NODE_ENV !== 'production'
    }),
    // pull backbone out of other bundles
    new webpack.optimize.CommonsChunkPlugin({
      name: 'backbone',
      minChunks: Infinity,
      chunks: [ 'app', 'raven' ]
    }),
    // pull webpack runtime and jquery out of all bundles
    new webpack.optimize.CommonsChunkPlugin({
      name: 'jquery',
      minChunks: Infinity
    }),
    // ignore moment locales
    // ...see http://stackoverflow.com/a/25426019/854407
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // pull all CSS out of JS bundles
    new ExtractTextPlugin({
      filename: styleOutput,
      allChunks: true
    }),
    new SassdocPlugin(),
    new CleanWebpackPlugin([outputParentDir], {
      root: __dirname,
      verbose: true,
      exclude: ['webpack-assets.json']
    }),
    // save webpack-assets.json mapping of names to bundled files
    new SaveAssetsJson({ path: assetsJsonPath, prettyPrint: true }),
    new HardSourceWebpackPlugin({
      cacheDirectory: path.join(__dirname, 'jscache/[confighash]'),
      recordsPath: path.join(__dirname, 'jscache/[confighash]/records.json'),
      configHash: (webpackConfig) => nodeObjectHash().hash(webpackConfig),
      environmentHash: {
        root: process.cwd(),
        directories: ['node_modules'],
        files: ['package.json']
      }
    }),
    // Trigger server reload after first build to ensure accurate asset mapping
    new WebpackShellPlugin({
      onBuildEnd: ['touch ./src/color_seasons/settings/base.py']
    })
  ],
  module: {
    rules: [
      {
        test: /(static\/js\/.*\.js$|test\/.*\.js$)/,
        exclude: /(node_modules|vendor)/,
        use: [{
          loader: 'babel-loader',
          options: { cacheDirectory: process.env.NODE_ENV !== 'production' }
        }]
      },
      {
        test: /\.woff$|\.woff2$|\.ttf$|\.eot$/,
        use: [{
          loader: 'file-loader',
          options: { name: mediaOutput }
        }]
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: { name: mediaOutput }
          },
          {
            loader: 'img-loader',
            options: {
              mozjpeg: { progressive: true }
            }
          }
        ]
      },
      {
        test: /\.njk$/,
        use: [{
          loader: 'jinja-loader',
          options: {
            root: path.join(__dirname, 'templates/')
          }
        }]
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                minimize: process.env.NODE_ENV === 'production'
              }
            },
            { loader: 'postcss-loader' },
            {
              loader: 'sass-loader',
              options: { sourceMap: true }
            }
          ]
        })
      }
    ]
  },
  devtool,
  performance: {
    hints: false
  }
};
