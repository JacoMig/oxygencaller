import React, { useEffect } from 'react';
import Box, {
    Item,
  } from 'devextreme-react/box';
import {Message} from './Message.ts';
import { Label } from 'devextreme-react/form';
import { useFetcher } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import './ConversationList.css';

//   className="item-box"
export default function MessageElement(props) 
{
  return (
    <React.Fragment>
        <div className={props.showUser===true ? 'messageUserCaptionOther' : 'messageUserCaptionUser'}>
          <Typography variant="subtitle2">
            {props.showUser===true ? props.item.username:''} {new Date(props.item.date).toLocaleTimeString()}
          </Typography>
        
        </div>
        <div className={props.showUser===true ? 'messageOther' : 'messageUser'}>
          <Typography variant="caption">
            {props.item.content}
          </Typography>
        </div>
    </React.Fragment>
)}