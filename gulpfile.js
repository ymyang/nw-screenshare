/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const os = require('os');
const path = require('path');
const gulp = require('gulp');
const shelljs = require('shelljs');
const jetpack = require('fs-jetpack');
const webpack = require('webpack');

const _isMac = os.type() === 'Darwin';

const nwVersion = '0.14.7';

const manifest = jetpack.read('./src/package.json', 'json');

gulp.task('clean', () => {
    //jetpack.dir('./build', { empty: true });
    jetpack.remove('./build')
});

gulp.task('webpack', () => {
    const config = require('./webpack.config.js');
    webpack(config, (err, stats) => {
        if (err) {
            console.error('webpack', err);
            return;
        }
        console.log('webpack ok');
    });
});

gulp.task('build', ['webpack'], () => {
    jetpack.copy('./src', './build', {
        overwrite: true,
        matching: ['package.json', 'main.html', 'main.js', 'socket-server.js', 'node_modules/**']
    });
});

// 启动调试
gulp.task('start', () => {
    let nwjs = 'res/nw/' + nwVersion + '/win32/nw.exe';
    if (_isMac) {
        nwjs = 'res/nw/' + nwVersion + '/osx64/nwjs.app/Contents/MacOS/nwjs';
    }
    const nw = path.join(__dirname, nwjs);
    console.log('nwjs:', nw);
    shelljs.exec(nw + ' ./build');
});

gulp.task('default', ['build']);