/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[socket]-';
const io = require('socket.io-client');

const url = location.host + ':3001';

console.log('socket url:', url);

const socket = io.connect(url);

socket.on('connect', function () {
    console.log(TAG, 'connect:', url);
});
socket.on('error', function (err) {
    console.log(TAG, 'error:', err);
});

socket.on('message', function (data) {
    console.log(TAG, 'message:', data);
});