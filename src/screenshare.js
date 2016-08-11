/**
 * Created by yang on 2016/8/11.
 */

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

var localStream;
var pc1;
var pc2;

var btnStart = document.getElementById('btn_start');
var btnShare = document.getElementById('btn_share');
var btnStop = document.getElementById('btn_stop');

nw.Screen.Init();

win.on('loaded', function() {
    win.show();

    btnStart = document.getElementById('btn_start');
    btnShare = document.getElementById('btn_share');
    btnStop = document.getElementById('btn_stop');

    btnShare.disabled = true;
    btnStop.disabled = true;

    btnStart.addEventListener('click', _start, false);
    btnShare.addEventListener('click', _share, false);
    btnStop.addEventListener('click', _stop, false);
});

function _start() {
    nw.Screen.chooseDesktopMedia(['window','screen'],
        function(sourceId) {
            console.log('sourceId:', sourceId);

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
                console.log('stream:', stream);

                localStream = stream;

                var sourceUrl = URL.createObjectURL(stream);
                console.log('local sourceUrl:', sourceUrl);

                document.getElementById('local_video').src = sourceUrl;

                btnStart.disabled = true;
                btnShare.disabled = false;

            }, function(err) {
                console.error('err:', err);
            });
        }
    );
}

function _share() {
    btnShare.disabled = true;
    btnStop.disabled = false;

    pc1 = new RTCPeerConnection({
        iceServers: []
    });

    pc1.onicecandidate = function(event) {
        if (event.candidate) {
            var candidate = new RTCIceCandidate(event.candidate);
            pc2.addIceCandidate(candidate);
        }
    };

    pc2 = new RTCPeerConnection({
        iceServers: []
    });

    pc2.onicecandidate = function(event) {
        if (event.candidate) {
            var candidate = new RTCIceCandidate(event.candidate);
            pc1.addIceCandidate(candidate);
        }
    };


    pc2.onaddstream = function(event) {
        var sourceUrl = URL.createObjectURL(event.stream);
        console.log('remote sourceUrl:', sourceUrl);

        document.getElementById('remote_video').src = sourceUrl;
    };

    pc1.addStream(localStream);


    pc1.createOffer(function(desc1) {

        console.log('Create Offer success');

        pc1.setLocalDescription(desc1);
        pc2.setRemoteDescription(desc1);

        pc2.createAnswer(function(desc2) {

            console.log('Create Answer success');

            pc2.setLocalDescription(desc2);
            pc1.setRemoteDescription(desc2);

        }, function() {
            console.log('Create Answer failed');
        });

    }, function() {
        console.log('Create Offer failed');
    }, offer_opts);
}

function _stop() {
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;

    btnShare.disabled = false;
    btnStop.disabled = true;
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