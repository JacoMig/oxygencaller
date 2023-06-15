
import './home.scss';
import { useAuth } from '../../contexts/auth';
import React, {useEffect,useRef, useState, useCallback, createRef} from "react";

import ConversationList from '../../components/chat/index.tsx';
import { Button } from 'devextreme-react/button';

import Grid from '@mui/material/Unstable_Grid2';


import { useLongPress } from 'use-long-press';
import VuMeter from '../../components/vumeter/vuMeter';

import '../../layouts/single-card/single-card';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import {ImHeadphones, ImMic,ImBlocked} from 'react-icons/im'
import { Popup, Position, ToolbarItem } from 'devextreme-react/popup';
import { LoadPanel } from 'devextreme-react/load-panel';
import useSetupHome from '../../hooks/use-setup-home/use-setup-home.hook';
import {addMessage} from "../../services/addMessage"

const position = { of: '#divContainer' };

export default function Home(props) {
    const { /* user, */ signOut } = useAuth();

   // const [isCoughPressed, setIsCoughPressed]=useState(false)
    const [text, setText] = useState('');
  

    const {
        webrtc,
        username,
        isPopupVisible,
        setIsPopupVisible,
        popupMessage,
        isConnecting,
        vuMeterValue,
        vuMeterLocalValue,
        meterRefresh,
        meForChat,
        messages,
        isOnair,
        isTalkback,
        bMessageArrived,
        setMessages} = useSetupHome()

 
    /* unused function
        const callback = useCallback(event => {
        console.log('Long pressed!');
      }, []); */
    /* unused function
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
    }); */


    const cmdLogoutClick=function(){
        webrtc.current.leaveRoom();
        if(bMessageArrived===false)
        {
            console.log("Forcing close ...")
            
            clearInterval(meterRefresh);
            webrtc.current.disconnect();
            try {
                if(window.audioContext.state !== 'closed' && window.audioContext.state !== 'suspended')
                window.audioContext.close();
            }
            catch{}
            signOut();
        }
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

    const cmdSendMessageClick=()=>{
        if(text==""){
            return 0
        }
          var chatMessage=text.replace(/\n/g, '\r\n');
          webrtc.current.sendDataChannelMessageToAll(chatMessage);
          addMessage(username.current,chatMessage , Date.now(), setMessages);

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

    /*  unused function
    const cmdCoughClick=()=>{
        var message={command:'cough', data:{type: 'CoughData', pressed: !isCoughPressed}}
        var textToSend=JSON.stringify(message);
        webrtc.current.sendDataChannelMessageToAll(textToSend);

        setIsCoughPressed(!isCoughPressed);
    } */

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
