
import './home.scss';
import { useAuth } from '../../contexts/auth';
import React, {useEffect,useRef, useState, useCallback, createRef} from "react";
import $ from "jquery"
import  SoundMeter from '../../components/vumeter/soundmeter';
import  PeakMeter from '../../components/vumeter/peakMeter';
import WebRTC from '../../components/webrtc/webrtc';
import SimpleWebRTC from '../../components/webrtc/simplewebrtc';
import {Message} from '../../components/chat/Message.ts';
import ConversationList from '../../components/chat/index.tsx';
import { Button } from 'devextreme-react/button';
import {Box, Item } from 'devextreme-react/box'
import Grid from '@mui/material/Unstable_Grid2';
import TextBox from 'devextreme-react/text-box';
import TextArea from 'devextreme-react/text-area';
import { Label } from 'devextreme-react/form';
import { useLongPress } from 'use-long-press';
import VuMeter from '../../components/vumeter/vuMeter';
import ScrollView from 'devextreme-react/scroll-view';
import '../../layouts/single-card/single-card';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import {FiHeadphones} from 'react-icons/fi'
import {ImHeadphones, ImMic,ImBlocked} from 'react-icons/im'
import { Popup, Position, ToolbarItem } from 'devextreme-react/popup';
import { LoadPanel } from 'devextreme-react/load-panel';


const position = { of: '#divContainer' };
const defaultVumeterValue=-60.0;
const defaultWaitForConnection=5000;
export default function Home(props) {
    const { user, signOut } = useAuth();

    const [vuMeterValue, setVuMeterValue]=useState({left:defaultVumeterValue, right:defaultVumeterValue})
    const [vuMeterLocalValue, setVuMeterLocalValue]=useState({left:defaultVumeterValue, right:defaultVumeterValue})
    
    const [isInCall, setIsInCall]=useState(false)
    const [isPopupVisible, setIsPopupVisible]=useState(false)
    const [popupMessage, setPopupMessage]= useState('');
    
    const [isConnecting, setIsConnecting]=useState(true)
    const [messages, setMessages] = useState([]);
    const [isOnair, setIsOnair]=useState(false)
    const [isTalkback, setIsTalkback]=useState(false)
    const [isCoughPressed, setIsCoughPressed]=useState(false)
    const [text, setText] = useState('');
    const [meForChat, setMeForchat]= useState('');
    const [debugMessage, setDebugMessage]= useState('');

    const firstTime = useRef(false);
    const webrtc = useRef(null);   
    const username= useRef("");
    const soundMeterLocal = useRef(null);
    const soundMeterRemote = useRef(null);
    var signalingServer = "https://reporter.axeltechnology.com:8889";
    var room ="";
    var targetId = "";
    var meterRefresh = null;
    var videoEl = null;
    var counter=0;
    var bMessageArrived=false;
    const callback = useCallback(event => {
        console.log('Long pressed!');
      }, []);
      const objUseLongPress = useLongPress(callback, {
        onStart: event => console.log('Press started'),
        onFinish: event => console.log('Long press finished'),
        onCancel: event => console.log('Press cancelled'),
        onMove: event => console.log('Detected mouse or touch movement'),
        filterEvents: event => true, // All events can potentially trigger long press
        threshold: 500,
        captureEvent: true,
        cancelOnMovement: false,
        detect: 'both',
      });


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

        room= user.code.slice(0, 5);
        targetId= user.code.slice(5);
        username.current=user.name;
        firstTime.current=true;
        setMeForchat(username.current);
        connectToSignalingServer();

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
            meterRefresh = setInterval(() => 
            {
                if(soundMeterLocal.current)
                {
                    var local = soundMeterLocal.current.getValues();
                    setVuMeterLocalValue({left:local.currentDB[0], right:local.currentDB[1]})
                }      
                else
                {
                    setVuMeterLocalValue({left:defaultVumeterValue, right:defaultVumeterValue})
                }      
                if(soundMeterRemote.current)
                {
                    var remote = soundMeterRemote.current.getValues();
                    setVuMeterValue({left:remote.currentDB[0], right:remote.currentDB[1]})
                }
                else
                {
                    setVuMeterValue({left:defaultVumeterValue, right:defaultVumeterValue})
                }    
            }, 200);    
        }, defaultWaitForConnection);
         

        return () => {
            clearInterval(meterRefresh);
          };
    },[]);
    
    const cmdLogoutClick=function(){
        webrtc.current.leaveRoom();
        if(bMessageArrived===false)
        {
            console.log("Forcing close ...")
            clearInterval(meterRefresh);
            webrtc.current.disconnect();
            try
            {window.audioContext.close();}
            catch{}
            signOut();
        }
    }
    const connectToSignalingServer=function()
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
  
          addEventToWebRTC();
        }
      
  
      const addEventToWebRTC=function()
      {
       // console.log('addEventToWebRTC');
             
        webrtc.current.on('connectionReady', function (sessionID) {
          console.log('connectionReady with ID: ', sessionID);
        });
        
        webrtc.current.on('videoRemoved', function (video, peer) {
          console.log('video removed ', peer);
          var container = document.getElementById('videoContainer');
          if (peer.id == targetId || peer.nickName == targetId) 
          {

              var currentRemote = document.getElementById('remotevideo');
              if (container && currentRemote)
                  container.removeChild(currentRemote);
              videoEl=null;
              var videoStub = document.createElement('video');
              videoStub.id = 'remotevideo';
              container.appendChild(videoStub);
              
              if(peer.closed===true)
              {
                signOut()
              }
          }
        });

        webrtc.current.on('localVideoStreamAdded', function (stream)
        {
            console.log("localVideoStreamAdded --> window.stream: ", stream);
            soundMeterLocal.current = new PeakMeter(window.audioContext,  null, "LOCAL");
            soundMeterLocal.current.connectToSource(stream, function(e) 
                {
                    if (e) 
                    {
                        alert(e);
                        setDebugMessage('ERROR:' + e)
                        return;
                    }else
                    setDebugMessage('soundMeterLocal OK')
                });
        });

        webrtc.current.on('videoAdded', function (video, peer) 
        {
            console.log('video added', peer);
            var container = document.getElementById('videoContainer');
            if (peer.id == targetId || peer.strongID == targetId || peer.nickName == targetId) 
            {
                var currentRemote = document.getElementById('remotevideo');
                if (container && currentRemote)
                {
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
  
                console.log("PEER.STREAM: ",peer.stream )


                //window.stream = peer.stream;
                soundMeterRemote.current = new PeakMeter(window.audioContext,  null, "REMOTE");
                soundMeterRemote.current.connectToSource(peer.stream, function(e) 
                    {
                        if (e) 
                        {
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
                
               bMessageArrived=true;
               var payload=JSON.parse(data.payload);
               if(payload.Command==="chat")
               {
                    var sender="";
                    if(payload.Data.Sender==="")
                        sender = "<server>";
                    else
                        sender = payload.Data.Sender;
                    addMessage(sender, payload.Data.Message, new Date(payload.Data.UnixTimeStamp*1000));    
               }
               else if(payload.Command==="status")
               {
                    //console.log("STATUS: ", payload.Data);
                    if(payload.Data.onAir===true)
                        setIsOnair(true);
                    else
                        setIsOnair(false);

                   console.log("payload.Data.talkback===true: ", payload.Data.talkback===true)     
                   if(payload.Data.talkback===true)
                        setIsTalkback(true);
                    else
                        setIsTalkback(false);   
               }
            }
        });

        webrtc.current.on('readyToCall', function () {
            webrtc.current.setInfo(username.current, webrtc.current.connection.connection.id, 'sender'); // Store strongId
            if (room) 
            {
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
    const hiddenPlayClick=()=>
    {
        console.log("hiddenPlayClick");
        window.audioContext.resume();
    } 
    
    const onPopupHiding=()=>
    {
        setIsPopupVisible(false);
        if(webrtc.current)
            webrtc.current.leaveRoom();
        else
            signOut();
    }

    const addMessage=(sender, message, date)=>
    {
        var msg=
        {
            date:date,
            content: message,
            username: sender,
            id: Date.now()
        }
        //console.log("Message: ", msg);
        setMessages(current => [ ...current, msg]);
    }

    const cmdSendMessageClick=()=>{
        if(text==""){
            return 0
        }
          var chatMessage=text.replace(/\n/g, '\r\n');
          webrtc.current.sendDataChannelMessageToAll(chatMessage);
          addMessage(username.current,chatMessage , Date.now());

          setText("");
    }

    const cmdTalkbackClick=()=>{
        var message={command:'talkback', data:null}
        var textToSend=JSON.stringify(message);
        webrtc.current.sendDataChannelMessageToAll(textToSend);
    }

    const cmdOnClick=()=>{
        var message={command:'on', data:null}
        var textToSend=JSON.stringify(message);
        webrtc.current.sendDataChannelMessageToAll(textToSend);
    }

    const cmdCoughClick=()=>{
        var message={command:'cough', data:{type: 'CoughData', pressed: !isCoughPressed}}
        var textToSend=JSON.stringify(message);
        webrtc.current.sendDataChannelMessageToAll(textToSend);

        setIsCoughPressed(!isCoughPressed);
    }

    const hVumeter=10;
  return (
    <React.Fragment>
        <div id="videoContainer" className="App" hidden>
                <video id="localvideo" ></video>
                <video id="remotevideo"></video>
        </div> 
        <br/> <button id="btnHiddenPlay" hidden onClick={()=>hiddenPlayClick()}></button>
        <div id="divContainer" height={'100%'} width={'100%'} className={'with-footer single-card'}>

        <LoadPanel
          shadingColor="rgba(0,0,0,0.4)"
          position={position}
        //   onHiding={this.hideLoadPanel}
          visible={isConnecting}
          showIndicator={true}
          shading={true}
          showPane={true}
        //   hideOnOutsideClick={this.state.hideOnOutsideClick}
        />
            <Popup
            visible={isPopupVisible}
            onHiding={()=>onPopupHiding()}
            dragEnabled={false}
            hideOnOutsideClick={true}
            showCloseButton={false}
            showTitle={true}
            title="Information"
            container=".dx-viewport"
            width={300}
            height={150}>
                <Grid container xs={12}>
                    <Grid xs={1}>
                        <ImBlocked size='auto'/>
                    </Grid>
                    <Grid xs={10} xsOffset={0.5}>
                        <div>{popupMessage}</div>
                    </Grid>
                </Grid>
            </Popup>
            <Grid container xs={12} sx={{justifyContent:"center"}}  >
                <Grid container xs={10} md={6} lg={4} rowSpacing={1}>
                    <Grid xs={1}>
                        <ImHeadphones size='auto'/>
                    </Grid>
                    <Grid container xs={11} >
                        <Grid xs={11} xsOffset={1}>
                            <VuMeter
                                direction="s"
                                height={hVumeter}
                                min={-40} max={0}
                                volume={vuMeterValue.left}
                            />
                        </Grid>
                        <Grid xs={11} xsOffset={1}>
                            <VuMeter
                                direction="s"
                                min={-40} max={0}
                                volume={vuMeterValue.right}
                                height={hVumeter}
                            />
                        </Grid>
                    </Grid>

                    <Grid xs={1}>
                        <ImMic size='auto'/>
                    </Grid>
                    <Grid container xs={11} >
                        <Grid xs={11} xsOffset={1}>
                            <VuMeter
                                direction="s"
                                height={hVumeter}
                                min={-40} max={0}
                                volume={vuMeterLocalValue.left}
                            />
                        </Grid>
                        <Grid xs={11} xsOffset={1}>
                            <VuMeter
                                direction="s"
                                min={-40} max={0}
                                volume={vuMeterLocalValue.right}
                                height={hVumeter}
                            />
                        </Grid>
                    </Grid>

                        <Grid xs={4} xsOffset={4} sx={{mt:"5px"}}>
                            <Button 
                                style={{backgroundColor: isTalkback?'red':"",textOverflow:"visible"}}
                                width="100%"
                                text="Talk Back"
                                onClick={() => cmdTalkbackClick()}
                            />
                        </Grid>
                        <Grid xs={4} sx={{mt:"5px"}} >
                            <Button 
                                style={{backgroundColor: isOnair?'red':""}}
                                width="100%"
                                text="OnAir"
                                onClick={() => cmdOnClick()}
                            />
                        </Grid>
                    <Grid container xs={12}>
                        <ConversationList
                            header={<h3>Messages:</h3>}
                            messages={messages}
                            username={meForChat}
                        />
                    </Grid>
                    <Grid container xs={12}>
                        <Grid xs={12} >
                            <TextField
                                sx={{ width: '100%' }}
                                id="filled-basic"
                                label="Enter message here"
                                value={text}
                                type="text" 
                                onChange={(e) => setText(e.target.value)}

                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Button 
                                                text="Send" 
                                                onClick={() => cmdSendMessageClick()}
                                            />
                                        </InputAdornment>
                                    ),

                                }}
                            >
                            </TextField>
                        </Grid>
                    </Grid>
                    <Grid container xs={12} sx={{justifyContent:"center"}} >
                        <Button 
                                width="50%"
                                text="Hang Up"
                                onClick={() => cmdLogoutClick()}
                            />
                    </Grid>
                </Grid>
            </Grid>
        </div>
        
    </React.Fragment>
)}
