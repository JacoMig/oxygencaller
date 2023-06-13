//Types
import ConversationListProps from "./ConversationList";
import Message from "./Message";
import React from 'react'
import { useEffect, useRef } from 'react'
//Assets
import './ConversationList.css';
import MessageElement from './MessageElement'
import {ScrollView} from 'devextreme-react/scroll-view'
import List from 'devextreme-react/list';

const ConversationList = ({
    className = '',
    header = null,
    messages = [],
    username = ''
}: ConversationListProps) => {
  
  const renderListItem = (itemData) => {
    var align='left';
    if(itemData.username==username)
    {
      return <div key={itemData.date} style={{ float:'right',paddingBottom:"5px"}}><MessageElement item={itemData} showUser={false}/></div>;
    } 
    else
    {
      return <div  key={itemData.date}  style={{ float:'left',paddingBottom:"5px"}}><MessageElement item={itemData} showUser={true} /></div>;
    }     
  }
  const messageRef = useRef();
  return (
    
        <div className={'chatContainer'}>

          {messages.map((e)=> renderListItem(e))}
        
        </div>

    
  )};

export default ConversationList;
