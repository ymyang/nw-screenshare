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

const manifest = jetpack.read('./src/app/package.json', 'json');

gulp.task('clean', () => {
    //jetpack.dir('./build', { empty: true });
    jetpack.remove('./build');
});

gulp.task('webpack-public', ()=>{
    const config = require('./webpack.public.js');
    webpack(config, (err, stats) => {
        if (err) {
            console.error('webpack public', err);
            return;
        }
        console.log('webpack public ok');
    });
});

gulp.task('webpack-app', () => {
    const config = require('./webpack.app.js');
    webpack(config, (err, stats) => {
        if (err) {
            console.error('webpack app', err);
            return;
        }
        console.log('webpack app ok');
    });
});

gulp.task('build', ['webpack-public', 'webpack-app'], () => {
    const manifest = jetpack.read('./package.json', 'json');
    const dependencies = manifest.dependencies;
    const matching = [];
    for (let p in dependencies) {
        matching.push(p + '/**');
    }

    jetpack.copy('./node_modules', './build/node_modules', {
        overwrite: true,
        matching: matching
    });

    jetpack.copy('./src/app/package.json', './build/package.json', {
        overwrite: true
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