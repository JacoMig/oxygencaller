import { useEffect, useState } from 'react';
import  PeakMeter from '../../components/vumeter/peakMeter';
import {useAuth}  from '../../contexts/auth';
import {addMessage} from "../../services/addMessage";
export const useAddEventToWebRTC = function (
    webrtc,
    targetId,
    soundMeterRemote,
    soundMeterLocal,
    setDebugMessage,
    username,
    room,
    meterRefresh,
    setIsConnecting
) {
    // console.log('addEventToWebRTC');
    const [bMessageArrived, setBMessageArrived] = useState(false);
    const { signOut } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isOnair, setIsOnair]=useState(false)
    const [isTalkback, setIsTalkback]=useState(false)
    let videoEl = null;

    useEffect(() => {
        if (webrtc.current) {
            webrtc.current.on('connectionReady', function (sessionID) {
                console.log('connectionReady with ID: ', sessionID);
                setIsConnecting(false)
            });
        
            webrtc.current.on('videoRemoved', function (video, peer) {
                console.log('video removed ', peer);
                var container = document.getElementById('videoContainer');
                if (peer.id == targetId || peer.nickName == targetId) {
        
                    var currentRemote = document.getElementById('remotevideo');
                    if (container && currentRemote)
                        container.removeChild(currentRemote);
                    videoEl = null;
                    var videoStub = document.createElement('video');
                    videoStub.id = 'remotevideo';
                    container.appendChild(videoStub);
        
                    if (peer.closed === true) {
                        signOut()
                    }
                }
            });
        
            webrtc.current.on('localVideoStreamAdded', function (stream) {
                console.log("localVideoStreamAdded --> window.stream: ", stream);
                soundMeterLocal.current = new PeakMeter(window.audioContext, null, "LOCAL");
                soundMeterLocal.current.connectToSource(stream, function (e) {
                    if (e) {
                        alert(e);
                        setDebugMessage('ERROR:' + e)
                        return;
                    } else
                        setDebugMessage('soundMeterLocal OK')
                });
            });
        
            webrtc.current.on('videoAdded', function (video, peer) {
                console.log('video added', peer);
                var container = document.getElementById('videoContainer');
                if (peer.id == targetId || peer.strongID == targetId || peer.nickName == targetId) {
                    var currentRemote = document.getElementById('remotevideo');
                    if (container && currentRemote) {
                        console.log('videoAdded removed ');
                        container.removeChild(currentRemote);
                    }
        
                    // peer.stream contiene lo stream remoto!!!!
        
                    video.setAttribute('loop', '');
                    video.setAttribute('autoplay', 'true');
                    video.setAttribute('controls', '');
                    video.setAttribute('width', '100%');
                    video.setAttribute('height', '100%');
        
                    videoEl = video;
                    videoEl.id = 'remotevideo';
                    container.appendChild(videoEl);
                    video.play();
        
                    console.log("PEER.STREAM: ", peer.stream)
        
        
                    //window.stream = peer.stream;
                    soundMeterRemote.current = new PeakMeter(window.audioContext, null, "REMOTE");
                    soundMeterRemote.current.connectToSource(peer.stream, function (e) {
                        if (e) {
                            alert(e);
                            setDebugMessage('soundMeterRemote ERROR:' + e)
                            return;
                        }
                        else
                            setDebugMessage('soundMeterRemote OK')
                    });
                    document.getElementById('btnHiddenPlay').click();
        
                }
            });
        
            webrtc.current.on('channelMessage', function (peer, label, data) {
                //console.log("channelMessage: ", data)
                if (data.type == 'custommessage') {
                    setBMessageArrived(true);
                    var payload = JSON.parse(data.payload);
                    if (payload.Command === "chat") {
                        var sender = "";
                        if (payload.Data.Sender === "")
                            sender = "<server>";
                        else
                            sender = payload.Data.Sender;
                        addMessage(sender, payload.Data.Message, new Date(payload.Data.UnixTimeStamp * 1000), setMessages);
                    }
                    else if (payload.Command === "status") {
                        //console.log("STATUS: ", payload.Data);
                        if (payload.Data.onAir === true)
                            setIsOnair(true);
                        else
                            setIsOnair(false);
        
                        console.log("payload.Data.talkback===true: ", payload.Data.talkback === true)
                        if (payload.Data.talkback === true)
                            setIsTalkback(true);
                        else
                            setIsTalkback(false);
                    }
                }
            });
        
            webrtc.current.on('readyToCall', function () {
                webrtc.current.setInfo(username.current, webrtc.current.connection.connection.id, 'sender'); // Store strongId
                if (room) {
                    console.log("joing room: ", room)
                    webrtc.current.joinRoom(room);
                }
            });
        
            webrtc.current.on('message', function (payload) {
                //console.log("MESSSAGE: ", payload)
            });
            webrtc.current.on('connectionClosed', function (roomName) {
                signOut();
            });
        
            webrtc.current.on('leftRoom', function (roomName) {
                clearInterval(meterRefresh);
                webrtc.current.disconnect();
                if(window.audioContext.state !== 'closed')
                    window.audioContext.close();
            });
        
            webrtc.current.on('error', function (err) {
                console.log("Error: ", err)
            });
        
        
            webrtc.current.on('joinedRoom', function (name, totalClients) {
                // if(totalClients>1)
                // {
                //     setIsPopupVisible(true);
                // }
            });
        }
    }, [webrtc.current]);

   return {
    messages,
    isOnair,
    isTalkback,
    bMessageArrived,
    setMessages
   }
}