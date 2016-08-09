/**
 * Created by yang on 2016/8/8.
 */

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        app: './src/public/app.js'
    },
    output: {
        path: './build/public',
        filename: 'app.js'
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
            filename: 'index.html',
            template: './src/public/index.html',
            inject: 'body',
            chunks: ['app']
        }),
        new webpack.optimize.UglifyJsPlugin()
    ]
};