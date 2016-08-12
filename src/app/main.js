/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const TAG = '[main]-';
const express = require('express');
const uuid = require('node-uuid');

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
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }
};

const clientId = uuid.v4();

let localStream = null;
const pcons = {};

let pc = null;

let btnStart = null;
let btnShare = null;
let btnStop = null;

let socket = null;

let share = false;

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

    const socketUrl = 'http://127.0.0.1:3001' + '?ci=' + clientId;
    console.log(TAG, 'socket url:', socketUrl);

    socket = io(socketUrl);

    socket.on('connect', function () {
        console.log(TAG, 'connect:', socketUrl);
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
            let pc = pcons[msg.clientId];
            if (pc) {
                let remoteDescription = msg.peerDescription;
                pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));
            }

        } else if (msg.type === 'candidate') {

            //console.log(TAG, 'Received ICE candidate:', JSON.stringify(msg.candidate));
            let pc = pcons[msg.clientId];
            if (pc) {
                let candidate = new RTCIceCandidate(msg.candidate);
                pc.addIceCandidate(candidate);
            }

        } else if (msg.type === 'join') {

            console.log(TAG, 'join clientId:', msg.clientId);

            pcons[msg.clientId] = null;
            if (share) {
                //
                _createPeerConnection(msg.clientId);
            }

        } else if (msg.type === 'leave') {

            console.log(TAG, 'leave clientId:', msg.clientId);

            let pc = pcons[msg.clientId];
            pc && pc.close();
            pcons[msg.clientId] = null;
            delete pcons[msg.clientId]

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
                        maxHeight: 1080,
                        minFrameRate: 1,
                        maxFrameRate: 5
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

    share = true;

    for (let ci in pcons) {
        _createPeerConnection(ci);
    }

}

function _createPeerConnection(remoteClientId) {
    const pc = new RTCPeerConnection({
        iceServers: []
    });

    pcons[remoteClientId] = pc;

    console.log(TAG, '[pc] clientId:', remoteClientId,  pc);

    pc.onicecandidate = function(event) {
        if (event.candidate) {
            socket.emit('message', {
                type: 'candidate',
                clientId: clientId,
                toClientId: remoteClientId,
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
            clientId: clientId,
            toClientId: remoteClientId,
            peerDescription: desc
        });

    }, function() {
        console.log(TAG, 'Create Offer failed');
    }, offer_opts);
}

function _stop() {
    share = false;

    btnStart.disabled = false;
    btnShare.disabled = false;
    btnStop.disabled = true;

    for (let ci in pcons) {
        let pc = pcons[ci];
        if (pc) {
            pc.close();
            pcons[ci] = null;
        }
    }
}