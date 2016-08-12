/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[app]-';
const io = require('socket.io-client');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
const RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;

const url = location.host + ':3001';

console.log(TAG, 'socket url:', url);

const socket = io(url);

socket.on('connect', function () {
    console.log(TAG, 'socket connect:', url);
});
socket.on('error', function (err) {
    console.log(TAG, 'socket error:', err);
});

var pc = null;

socket.on('message', function (msg) {
    console.log(TAG, 'socket message:', msg);

    if (msg.type === 'offer') {
        //
        console.log(TAG, 'Received offer:', msg.peerDescription);

        _createPeerConnection();

        var remoteDescription = msg.peerDescription;
        pc.setRemoteDescription(new RTCSessionDescription(remoteDescription), function() {
            console.log(TAG, 'Sending answer...');
            pc.createAnswer(function(sessionDescription) {

                pc.setLocalDescription(sessionDescription);

                socket.emit('message', {
                    type: 'answer',
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
        var candidate = new RTCIceCandidate(msg.candidate);
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
                candidate: event.candidate
            });
        }
    };

    pc.oniceconnectionstatechange = function(event) {
        console.log(TAG, 'oniceconnectionstatechange:', pc.iceConnectionState);
    };

    pc.onaddstream = function(event) {
        console.log(TAG, 'onaddstream:', event);
        var sourceUrl = URL.createObjectURL(event.stream);
        console.log(TAG, 'sourceUrl:', sourceUrl);
        document.getElementById('remote_video').src = sourceUrl;
    };
}
