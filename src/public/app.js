/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[app]-';
const io = require('socket.io-client');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
const RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;

const url = location.host + ':3001';

console.log('socket url:', url);

const socket = io(url);

socket.on('connect', function () {
    console.log(TAG, 'connect:', url);
});
socket.on('error', function (err) {
    console.log(TAG, 'error:', err);
});

var pc = null;

socket.on('message', function (msg) {
    console.log(TAG, 'message:', msg);

    if (msg.type === 'offer') {
        //
        console.log('Received offer:', msg.peerDescription);

        _createPeerConnection();

        var remoteDescription = msg.peerDescription;
        pc.setRemoteDescription(new RTCSessionDescription(remoteDescription), function() {
            console.log('Sending answer...');
            pc.createAnswer(function(sessionDescription) {

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

    } else if (msg.type === 'answer') {
        //
        console.log('Received answer:', msg.peerDescription);

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

    console.log('[pc]:', pc);

    pc.onicecandidate = function(event) {
        if (event.candidate) {
            socket.emit('message', {
                type: 'candidate',
                candidate: event.candidate
            });
        }
    };

    pc.oniceconnectionstatechange = function(event) {
        console.log('oniceconnectionstatechange:', pc.iceConnectionState);
    };

    pc.onaddstream = function(event) {
        console.log('onaddstream:', event);
        var sourceUrl = URL.createObjectURL(event.stream);
        console.log('sourceUrl:', sourceUrl);
        document.getElementById('video_1').src = sourceUrl;
    };
}
