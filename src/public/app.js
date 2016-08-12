/**
 * Created by yang on 2016/8/8.
 */
'use strict'

const TAG = '[app]-';
const io = require('socket.io-client');
const uuid = require('node-uuid');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
const RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;

const clientId = uuid.v4();

const socketUrl = location.host + ':3001' + '?ci=' + clientId;

console.log(TAG, 'socket url:', socketUrl);

const socket = io(socketUrl);

socket.on('connect', function () {
    console.log(TAG, 'socket connect:', socketUrl);
});
socket.on('error', function (err) {
    console.log(TAG, 'socket error:', err);
});

let pc = null;
let remoteClientId = null;

socket.on('message', function (msg) {
    console.log(TAG, 'socket message:', msg);

    if (msg.type === 'offer') {
        //
        console.log(TAG, 'Received offer:', msg.peerDescription);

        remoteClientId = msg.clientId;

        _createPeerConnection();

        const remoteDescription = msg.peerDescription;
        pc.setRemoteDescription(new RTCSessionDescription(remoteDescription), function() {
            console.log(TAG, 'Sending answer...');
            pc.createAnswer(function(sessionDescription) {

                pc.setLocalDescription(sessionDescription);

                socket.emit('message', {
                    type: 'answer',
                    clientId: clientId,
                    toClientId: remoteClientId,
                    peerDescription: sessionDescription
                });

            }, function() {
                console.log(TAG, 'Create Offer failed');
            });
        }, function() {
            console.log(TAG, 'Error setting remote description');
        });

    } else if (msg.type === 'answer') {
        //
        console.log(TAG, 'Received answer:', msg.peerDescription);

        return;

    } else if (msg.type === 'candidate') {
        //
        const candidate = new RTCIceCandidate(msg.candidate);
        console.log(candidate);
        pc.addIceCandidate(candidate);
    }
});

function _createPeerConnection() {
    pc = new RTCPeerConnection({
        iceServers: []
    });

    console.log(TAG, '[pc]:', pc);

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

    pc.onaddstream = function(event) {
        console.log(TAG, 'onaddstream:', event);
        const sourceUrl = URL.createObjectURL(event.stream);
        console.log(TAG, 'sourceUrl:', sourceUrl);
        document.getElementById('remote_video').src = sourceUrl;
    };
}
