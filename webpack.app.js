/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        app: './src/app/main.js'
    },
    output: {
        path: './build',
        filename: 'main.js'
    },
    target: 'node-webkit',
    externals: _externals(),
    node: {
        console: true,
        global: true,
        process: true,
        Buffer: true,
        __filename: true,
        __dirname: true,
        setImmediate: true
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'ng-annotate!babel?presets[]=es2015',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'main.html',
            template: './src/app/main.html',
            inject: 'body',
            chunks: ['app']
        }),
        //new webpack.optimize.UglifyJsPlugin()
    ]
};

function _externals() {
    var manifest = require('./package.json');
    var dependencies = manifest.dependencies;
    var externals = {};
    for (let p in dependencies) {
        externals[p] = 'commonjs ' + p;
    }
    return externals;
}