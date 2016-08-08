/**
 * Created by yang on 2016/8/8.
 */
const express = require('express');
const app = express();

app.use(express.static('./public'));

//app.get('/', function (req, res) {
//    res.send('Hello World!');
//});

const port = 80;
app.listen(port, () => {
    console.log('Example app listening on port', port);
});

const win = nw.Window.get();

win.on('loaded', function() {
    win.show();

    var btn = document.getElementById('btn_select');
    btn.addEventListener('click', _select, false);
});

nw.App.on('open', function(cmd) {
    win.show();
});

nw.App.on('reopen', function(cmd) {
    win.show();
});

nw.Screen.Init(); // you only need to call this once

function _select() {
    nw.Screen.chooseDesktopMedia(['window','screen'],
        (streamId) => {
            console.log('streamId:', streamId);

            var vid_constraint = {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: streamId,
                    maxWidth: 1920,
                    maxHeight: 1080
                },
                optional: []
            };
            navigator.webkitGetUserMedia({
                audio: false,
                video: vid_constraint
            }, (stream) => {
                console.log('stream');
                document.getElementById('video_1').src = URL.createObjectURL(stream);
                stream.onended = function() { console.log("Ended"); };
            }, (err) => {
                console.error('err:', err);
            });
        }
    );
}
