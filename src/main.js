/**
 * Created by yang on 2016/8/8.
 */
const express = require('express');
const app = express();

app.use(express.static('./public'));

const port = 80;
app.listen(port, () => {
    console.log('express app listening on port', port);
});

require('./socket.js');

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

            const vid_constraint = {
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
                console.log('stream:', stream);

                var streamUrl = URL.createObjectURL(stream);
                console.log('streamUrl:', streamUrl);
                document.getElementById('video_1').src = streamUrl;

                stream.onended = () => {
                    console.log("Ended");
                };
            }, (err) => {
                console.error('err:', err);
            });
        }
    );
}
