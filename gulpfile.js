/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const os = require('os');
const path = require('path');
const gulp = require('gulp');
const shelljs = require('shelljs');
const jetpack = require('fs-jetpack');

const _isMac = os.type() === 'Darwin';

const nwVersion = '0.14.7';

const manifest = jetpack.read('./src/package.json', 'json');

// 启动调试
gulp.task('start', () => {
    let nwjs = 'res/nw/' + nwVersion + '/win32/nw.exe';
    if (_isMac) {
        nwjs = 'res/nw/' + nwVersion + '/osx64/nwjs.app/Contents/MacOS/nwjs';
    }
    const nw = path.join(__dirname, nwjs);
    console.log('nwjs:', nw);
    shelljs.exec(nw + ' ./src');
});

gulp.task('default', ['start']);