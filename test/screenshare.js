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

var localStream = null;
var pc1 = null;
var pc2 = null;

var btnStart = null;
var btnShare = null;
var btnStop = null;

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

                btnShare.disabled = false;

            }, function(err) {
                console.error('err:', err);
            });
        }
    );
}

function _share() {
    btnStart.disabled = true;
    btnShare.disabled = true;
    btnStop.disabled = false;

    pc1 = new RTCPeerConnection({
        iceServers: []
    });

    pc2 = new RTCPeerConnection({
        iceServers: []
    });

    console.log('[pc1]:', pc1);
    console.log('[pc2]:', pc2);

    pc1.onicecandidate = function(event) {
        console.log('[pc1] onicecandidate:', event);
        if (event.candidate) {
            var candidate = new RTCIceCandidate(event.candidate);
            pc2.addIceCandidate(candidate);
        }
    };

    pc2.onicecandidate = function(event) {
        console.log('[pc2] onicecandidate:', event);
        if (event.candidate) {
            var candidate = new RTCIceCandidate(event.candidate);
            pc1.addIceCandidate(candidate);
        }
    };

    pc1.oniceconnectionstatechange = function(event) {
        console.log('[pc1] oniceconnectionstatechange:', pc1.iceConnectionState);
    };

    pc2.oniceconnectionstatechange = function(event) {
        console.log('[pc2] oniceconnectionstatechange:', pc2.iceConnectionState);
    };

    pc2.onaddstream = function(event) {
        console.log('[pc2] onaddstream:', event);
        var sourceUrl = URL.createObjectURL(event.stream);
        console.log('remote sourceUrl:', sourceUrl);

        document.getElementById('remote_video').src = sourceUrl;
    };

    pc1.addStream(localStream);
    console.log('[pc1] addStream:', localStream);

    pc1.createOffer(function(desc1) {

        console.log('[pc1] Create Offer success');

        pc1.setLocalDescription(desc1);
        pc2.setRemoteDescription(desc1);

        pc2.createAnswer(function(desc2) {

            console.log('[pc2] Create Answer success');

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

    btnStart.disabled = false;
    btnShare.disabled = false;
    btnStop.disabled = true;
}
