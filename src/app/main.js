/**
 * Created by yang on 2016/8/8.
 */
const TAG = '[main]-';
const express = require('express');
const app = express();

app.use(express.static('./public'));

const port = 80;
app.listen(port, () => {
    console.log(TAG, 'express app listening on port', port);
});

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
const RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;


const win = nw.Window.get();

const offer_opts = {
    optional: [],
    mandatory: {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: true
    }
};

let localStream = null;
let pc = null;

let btnStart = null;
let btnShare = null;
let btnStop = null;

let socket = null;

nw.Screen.Init();

win.on('loaded', function() {
    win.show();

    require('./socket-server.js');

    _socket();

    btnStart = document.getElementById('btn_start');
    btnShare = document.getElementById('btn_share');
    btnStop = document.getElementById('btn_stop');

    btnShare.disabled = true;
    btnStop.disabled = true;

    btnStart.addEventListener('click', _start, false);
    btnShare.addEventListener('click', _share, false);
    btnStop.addEventListener('click', _stop, false);
});

function _socket() {
    const io = require('socket.io-client');
    const url = 'http://127.0.0.1:3001';
    console.log(TAG, 'socket url:', url);

    socket = io(url);


    socket.on('connect', function () {
        console.log(TAG, 'connect:', url);
    });
    socket.on('error', function (err) {
        console.log(TAG, 'error:', err);
    });

    socket.on('message', function (msg) {
        console.log(TAG, 'message:', msg);

        if (msg.type === 'offer') {
            //
            console.log(TAG, 'Received offer:', msg.peerDescription);

        } else if (msg.type === 'answer') {

            console.log(TAG, 'Received answer:', msg.peerDescription);
            const remoteDescription = msg.peerDescription;
            pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));

        } else if (msg.type === 'candidate') {

            //console.log(TAG, 'Received ICE candidate:', JSON.stringify(msg.candidate));
            const candidate = new RTCIceCandidate(msg.candidate);
            pc.addIceCandidate(candidate);
        }
    });
}

function _start() {
    nw.Screen.chooseDesktopMedia(['window','screen'],
        function(sourceId) {
            console.log(TAG, 'sourceId:', sourceId);

            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        maxWidth: 1920,
                        maxHeight: 1080
                    },
                    optional: []
                }
            }, function(stream) {
                console.log(TAG, 'stream:', stream);

                localStream = stream;

                const sourceUrl = URL.createObjectURL(stream);
                console.log(TAG, 'local sourceUrl:', sourceUrl);

                document.getElementById('local_video').src = sourceUrl;

                btnShare.disabled = false;

            }, function(err) {
                console.error(TAG, 'err:', err);
            });
        }
    );
}

function _share() {
    btnStart.disabled = true;
    btnShare.disabled = true;
    btnStop.disabled = false;

    pc = new RTCPeerConnection({
        iceServers: []
    });

    console.log(TAG, '[pc]:', pc);

    pc.onicecandidate = function(event) {
        if (event.candidate) {
            socket.emit('message', {
                type: 'candidate',
                candidate: event.candidate
            });
        }
    };

    pc.oniceconnectionstatechange = function(event) {
        console.log(TAG, 'oniceconnectionstatechange:', pc.iceConnectionState);
    };

    pc.addStream(localStream);


    pc.createOffer(function(desc) {

        console.log(TAG, 'Create Offer success');

        pc.setLocalDescription(desc);

        socket.emit('message', {
            type: 'offer',
            peerDescription: desc
        });

    }, function() {
        console.log(TAG, 'Create Offer failed');
    }, offer_opts);
}

function _stop() {
    pc.close();
    pc = null;

    btnStart.disabled = false;
    btnShare.disabled = false;
    btnStop.disabled = true;
}