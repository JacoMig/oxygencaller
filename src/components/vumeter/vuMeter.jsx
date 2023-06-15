import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { styled,createTheme } from '@mui/material/styles';



function VuMeter(props) {

    const [volume, setVolume] = useState("");
    const [direction, setDirection] = useState("");

    const [min, setMin] = useState("");
    const [max, setMax] = useState("");

    const [customWidth, setCustomWidth] = useState("");
    const [customHeight, setCustomHeight] = useState("");

    const [color, setColor] = useState(0.0);
    
    //console.log("color percentage:",color)

    useEffect(()=>{
        setDirection(props.direction)
        setMin(props.min)
        setMax(props.max)

        if(props.height!=null)
        setCustomHeight(props.height)

        if(props.width!=null)
        setCustomWidth(props.width)
    },[props]);


    const handleHeight=function(){

        if(customHeight!=""){

            return customHeight+"px"

        }else if(direction=="vertical"){

            return "100%"
        }else{
            return "50px"
        }
    }

    const handleWidth=function(){
        if(customWidth!=""){

            return customWidth+"px"

        }else if(direction=="vertical"){

            return "250px"
        }else{
            return "100%"
        }
    }

    const handleStripes=function(){

        if(direction=="vertical"){
            return "linear-gradient(to bottom, #555 10px, transparent 1px)"
        }else{
            return "repeating-linear-gradient(to right, black, black 100px, ivory 1px, ivory 1px)"
        }
    }
    const handleRepeat=function(){

        if(direction=="vertical"){
            return "repeat-y"
        }else{
            return "repeat-x"
        }
    }

    const handleMeter=function(){

        if(direction=="vertical"){
            return "linear-gradient(to top, green 0%, yellow 80%, red 100%)"
        }else{
            return "linear-gradient(to right, green 0%, yellow 80%, red 100%)"
        }
    }
    const handleBs=function(){

        if(direction=="vertical"){
            return"100% 10px"
        }else{
            return "10px 100%"
        }
    }

    const handleBsLines=function(){

        if(direction=="vertical"){
            return "linear-gradient(to bottom, #333 2px , transparent 1px)"
        }else{
            return "linear-gradient(to right, #333 2px , transparent 1px)"
        }
    }

    const handleClip=function(){

        if(direction=="vertical"){
            return "inset("+color+"% 0 0 0 )"
        }else{
            return "inset( 0 "+color+"% 0 0 )"
        }
    }


    const meterBackground = {
        height: handleHeight(),
        width: handleWidth(),
        backgroundColor: "#222",
        borderRadius: "2px",
        display: "flex",
        flexDirection: "row",
        padding: "4px 3px",
        margin: "auto",
    }
    
    const Meter = styled('div')((props) =>({
        height: handleHeight(),
        width: handleWidth(),
        position: "relative",
        margin: "0 2px",
        flexGrow: "1",
        zIndex: 3,
        backgroundColor: "transparent",
        backgroundRepeat: handleRepeat(),
        backgroundImage: handleStripes(),
        backgroundSize: handleBs(),
        
        '&:before': {

            height: "100%",
            width: "100%",
            content: '" """',
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 1,
            backgroundRepeat: "no-repeat",
            backgroundImage:handleMeter(),
            
            clipPath: handleClip(),
            
        },
        '&::after': {
            width: "100%",
            height: "100%",
            content: '" """',
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 2,
            backgroundImage:handleBsLines(),
            backgroundRepeat: handleRepeat(),
            backgroundSize: handleBs(), 
            backgroundColor: "transparent",

        },
        
    }));
    

    useEffect(()=>{

        setVolume(props.volume)
        paintMeter()
    },[props.volume]);

    console.log()


    const paintMeter = () =>{

        let colorPercentage = "-";  
        let maxVolume = max;
        let minVolume = min;  
        //console.log("maxVolume",maxVolume)
        //console.log("minVolume",minVolume)  

        let onePercent = (maxVolume-minVolume)/100;

        //console.log("onePercent",onePercent)
        let difference = maxVolume - volume;
        
        //console.log("difference",difference)
        colorPercentage = Math.abs(difference/onePercent);
    
        setColor(colorPercentage);

    }

    return (
        <Grid sx={meterBackground} container xs ={12}>

            <Meter  color={color.toString()} xs ={12}> 

            </Meter>

        </Grid>

    );
  }

  export default VuMeter;