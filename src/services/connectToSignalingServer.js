import SimpleWebRTC from '../components/webrtc/simplewebrtc';

const signalingServer = "https://reporter.axeltechnology.com:8889";

export  const connectToSignalingServer = function(webrtc,targetId)
{
    
    webrtc.current = new SimpleWebRTC({
    target: targetId,
    url: signalingServer,
    iceServers:  [
      {url: "stun:stun.l.google.com:19302"}, 
      {username: "axelturn_user", credential: "turnuser2020!", urls: ["turn:reporter.axeltechnology.com:3478"]}
    ],
    localVideoEl: 'localvideo',
    remoteVideosEl: '',
    autoRequestMedia: true,
    enableDataChannels: true,
    debug: false,
    media: {
        video: false,
        audio: true
    },
    detectSpeakingEvents: true,
    autoAdjustMic: false
});

// addEventToWebRTC();
}