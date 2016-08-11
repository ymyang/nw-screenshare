/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[main]-';
const express = require('express');
const app = express();

app.use(express.static('./public'));

const port = 80;
app.listen(port, () => {
    console.log('express app listening on port', port);
});

//require('./socket.js');

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

const io = require('socket.io-client');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

const url = 'http://127.0.0.1:3001';

console.log('socket url:', url);

const socket = io(url);

socket.on('connect', function () {
    console.log(TAG, 'connect:', url);
});
socket.on('error', function (err) {
    console.log(TAG, 'error:', err);
});

var pc = null;
var mediaFlowing = false;
var useH264 = true;

socket.on('message', function (msg) {
    console.log(TAG, 'message:', msg);

    if (msg.type === 'offer') {
        //
        console.log('Received offer:', msg.peerDescription);

        return;

        if (!mediaFlowing) {
            _createPeerConnection();
            mediaFlowing = true;
        }

        var remoteDescription = msg.peerDescription;
        var RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
        pc.setRemoteDescription(new RTCSessionDescription(remoteDescription), function() {
            console.log('Sending answer...');
            pc.createAnswer(function(sessionDescription) {
                console.log('sessionDescription', sessionDescription);

                if (useH264) {
                    // use H264 video codec in offer every time
                    sessionDescription.sdp = useH264Codec(sessionDescription.sdp);
                }

                pc.setLocalDescription(sessionDescription);

                socket.emit('message', {
                    type: 'answer',
                    peerDescription: sessionDescription
                });

            }, function() {
                console.log('Create Offer failed');
            });
        }, function() {
            console.log('Error setting remote description');
        });

    } else if (msg.type === 'answer' && mediaFlowing) {
        //
        console.log('Received answer:', msg.peerDescription);
        var remoteDescription = msg.peerDescription;
        var RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
        pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));
    } else if (msg.type === 'candidate' && mediaFlowing) {
        //
        console.log('Received ICE candidate:', JSON.stringify(msg.candidate));
        var RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: msg.candidate.sdpMLineIndex,
            sdpMid: msg.candidate.sdpMid,
            candidate: msg.candidate.candidate
        });
        console.log(candidate);
        pc.addIceCandidate(candidate);
    }
});

function _createPeerConnection() {
    pc = new RTCPeerConnection({
        iceServers: []
    });

    console.log('RTCPeerConnection:', pc);

    pc.onicecandidate = function(event) {
        console.log('onicecandidate', event.candidate);

        if (event.candidate) {
            socket.emit('message', {
                type: 'candidate',
                candidate: event.candidate
            });
        }
    };

    pc.onaddstream = function(obj) {
        console.log('onaddstream:', obj);
        var sourceUrl = URL.createObjectURL(obj.stream);
        console.log('sourceUrl:', sourceUrl);
        //document.getElementById('video_1').src = sourceUrl;
    };
}

function _select() {
    nw.Screen.chooseDesktopMedia(['window','screen'],
        (sourceId) => {
            console.log('sourceId:', sourceId);

            const vid_constraint = {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    maxWidth: 1920,
                    maxHeight: 1080
                },
                optional: []
            };
            navigator.webkitGetUserMedia({
                audio: false,
                video: vid_constraint
            }, (source) => {
                console.log('source:', source);

                _createPeerConnection();

                mediaFlowing = true;

                console.log('Sending offer...');

                pc.addStream(source);

                pc.createOffer(function(sessionDescription) {
                    console.log('sessionDescription', sessionDescription);

                    if (useH264) {
                        // use H264 video codec in offer every time
                        sessionDescription.sdp = useH264Codec(sessionDescription.sdp);
                    }

                    pc.setLocalDescription(sessionDescription);

                    socket.emit('message', {
                        type: 'offer',
                        peerDescription: sessionDescription
                    });
                }, function() {
                    console.log("Create Offer failed");
                }, {
                    optional: [],
                    mandatory: {
                        OfferToReceiveAudio: false,
                        OfferToReceiveVideo: true
                    }
                });

                var sourceUrl = URL.createObjectURL(source);
                console.log('sourceUrl:', sourceUrl);
                document.getElementById('video_1').src = sourceUrl;

                source.onended = () => {
                    console.log("Ended");
                };
            }, (err) => {
                console.error('err:', err);
            });
        }
    );
}

function useH264Codec(sdp) {
    var updated_sdp = null;
    var isFirefox = typeof InstallTrigger !== 'undefined';

    if (isFirefox) {
        updated_sdp = sdp.replace("m=video 9 UDP/TLS/RTP/SAVPF 120 126 97\r\n","m=video 9 UDP/TLS/RTP/SAVPF 126 120 97\r\n");
    } else {
        updated_sdp = sdp.replace("m=video 9 UDP/TLS/RTP/SAVPF 100 101 107 116 117 96 97 99 98\r\n","m=video 9 UDP/TLS/RTP/SAVPF 107 101 100 116 117 96 97 99 98\r\n");
    }

    return updated_sdp;
}
