/**
 * Created by yang on 2016/8/8.
 */
var TAG = '[app]-';
const io = require('socket.io-client');

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;

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
var mediaFlowing = false;
var useH264 = true;

socket.on('message', function (msg) {
    console.log(TAG, 'message:', msg);

    if (msg.type === 'offer') {
        //
        console.log('Received offer:', msg.peerDescription);
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

        return;

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
        document.getElementById('video_1').src = sourceUrl;
    };
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