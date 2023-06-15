import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/auth";
import {connectToSignalingServer} from  "../../services/connectToSignalingServer"
import {useAddEventToWebRTC} from "../use-event-webrtc/use-event-webrtc.hook"
const useSetupHome = () => {

    const firstTime = useRef(false);
    const { user } = useAuth();
    let meterRefresh = useRef(null);
    let webrtc = useRef(null);
    let soundMeterLocal = useRef(null);
    let soundMeterRemote = useRef(null);
    let username = useRef("");
    let room = useRef("");
    let targetId = useRef("");
    
    const [isPopupVisible, setIsPopupVisible]=useState(false)
    const [debugMessage, setDebugMessage]= useState('');
    const [popupMessage, setPopupMessage]= useState('');
    const [isConnecting, setIsConnecting]= useState(true);
    const [vuMeterValue, setVuMeterValue]= useState({left:0, right:0});
    const [vuMeterLocalValue, setVuMeterLocalValue]= useState({left:0, right:0});
    const defaultVumeterValue=-60.0;
    const defaultWaitForConnection=5000;
    const [meForChat, setMeForchat]= useState('');

    const {
        messages,
        isOnair,
        isTalkback,
        bMessageArrived,
        setMessages
       } = useAddEventToWebRTC(
        webrtc,
        targetId,
        soundMeterRemote,
        soundMeterLocal,
        setDebugMessage,
        username,
        room.current,
        meterRefresh)

    useEffect(()=>
    {
        if(firstTime.current==true) return;        
        // console.log("FIRSTTIME: ", firstTime)
        // console.log("USER: ", user)

        if(user.code.length!=10)
        {
            setIsPopupVisible(true);
            setPopupMessage("Code not valid");
            return;
        }
        room.current = user.code.slice(0, 5)
        targetId.current = user.code.slice(5)
        username.current=user.name;
        firstTime.current=true;
        setMeForchat(username.current);
        connectToSignalingServer(webrtc, targetId);

        document.addEventListener("loggingOff", function(e) {
            clearInterval(meterRefresh);
            if(soundMeterLocal.current)
                soundMeterLocal.current.stop()
            if(soundMeterRemote.current)
                soundMeterRemote.current.stop()
            webrtc.current.leaveRoom();
          });

        try {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            window.audioContext = new AudioContext();
        } catch (e) {
            alert('Web Audio API not supported.');
            setDebugMessage('Web Audio API not supported.')
        }

        setTimeout(() => {
            // aspetto 2 sec per vedere se mi è arrivato un messaggio!!!
            setIsConnecting(false);
            // if(bMessageArrived===true)
            // {
            //     setIsConnecting(false);
            // }
            // else
            // {
            //     setIsConnecting(false);
            //     setPopupMessage("Connection not allowed. Logging out...");
            //     setIsPopupVisible(true);
            // }
            meterRefresh.current = setInterval(() => 
            {
                if(soundMeterLocal.current)
                {
                    let local = soundMeterLocal.current.getValues();
                    setVuMeterLocalValue({left:local.currentDB[0], right:local.currentDB[1]})
                }      
                else
                {
                    setVuMeterLocalValue({left:defaultVumeterValue, right:defaultVumeterValue})
                }      
                if(soundMeterRemote.current)
                {
                    let remote = soundMeterRemote.current.getValues();
                    setVuMeterValue({left:remote.currentDB[0], right:remote.currentDB[1]})
                }
                else
                {
                    setVuMeterValue({left:defaultVumeterValue, right:defaultVumeterValue})
                }    
            }, 200);    
        }, defaultWaitForConnection);
         

        return () => {
            clearInterval(meterRefresh.current);
          };
    },[]);


    return {
        room: room.current,
        targetId: targetId.current,
        meterRefresh: meterRefresh.current,
        isPopupVisible,
        setIsPopupVisible,
        debugMessage,
        setDebugMessage,
        popupMessage,
        isConnecting,
        vuMeterValue,
        vuMeterLocalValue,
        meForChat,
        soundMeterLocal,
        soundMeterRemote,
        webrtc,
        username,
        messages,
        isOnair,
        isTalkback,
        bMessageArrived,
        setMessages
    }
}




export default useSetupHome