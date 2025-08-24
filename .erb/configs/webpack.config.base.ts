/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

// 添加这个自定义插件来处理 node: 前缀
class NodeProtocolPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('NodeProtocolPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('NodeProtocolPlugin', (data) => {
        if (data && data.request && data.request.startsWith('node:')) {
          data.request = data.request.substring(5);
        }
        return true; // 返回 true 表示继续处理
      });
    });
  }
}

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {})],

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
            compilerOptions: {
              module: 'nodenext',
              moduleResolution: 'nodenext',
            },
          },
        },
      },
      {
        test: /\.node$/,
        loader: 'native-ext-loader',
        options: {
          emit: false,
          rewritePath:
            process.env.NODE_ENV === 'production'
              ? './'
              : 'node_modules/trtc-electron-sdk/build/Release/'
        }
      }
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: { type: 'commonjs2' },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    // There is no need to add aliases here, the paths in tsconfig get mirrored
    plugins: [new TsconfigPathsPlugins()],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": require.resolve("browserify-fs"),
      "util": require.resolve("util/"),
      "stream": require.resolve("stream-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "assert": require.resolve("assert/"),
    },
    // 添加别名映射
    alias: {
      'node:assert': 'assert',
      'node:buffer': 'buffer',
      'node:crypto': 'crypto-browserify',
      'node:stream': 'stream-browserify',
      'node:util': 'util',
      'node:path': 'path-browserify',
      'node:os': 'os-browserify/browser',
      'process/browser': require.resolve('process/browser.js')  // 显式指定正确路径
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV: 'production' }),
    new NodePolyfillPlugin(),
    new NodeProtocolPlugin(),
    // 提供 process 对象
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    // 定义全局变量
    new webpack.DefinePlugin({
      'process.platform': JSON.stringify(process.platform),
      'process.env': JSON.stringify(process.env),
      'process.browser': true,
      'process.type': JSON.stringify('renderer')
    })
  ],
};

export default configuration;
