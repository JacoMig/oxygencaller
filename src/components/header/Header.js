import React from 'react';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import UserPanel from '../user-panel/UserPanel';
import './Header.scss';
import { Template } from 'devextreme-react/core/template';
import logoAxel from '../../img/LogoAxel.svg'

export default function Header({ menuToggleEnabled, title, toggleMenu }) {
  return (
    <header className={'header-component'}>
      <Toolbar className={'header-toolbar'}>
        {/* <Item
          visible={menuToggleEnabled}
          location={'before'}
          widget={'dxButton'}
          cssClass={'menu-button'}
        >
          <Button icon="menu" stylingMode="text" onClick={toggleMenu} />
        </Item> */}
        <Item location={'before'}>
          <img className='logo' src={logoAxel} style={{height:'100%'}}/>
        </Item>
        <Item
          location={'center'}
          cssClass={'header-title'}
          text={title}
          visible={!!title}
        />
        {/* <Item
          location={'after'}
          locateInMenu={'auto'}
          menuItemTemplate={'userPanelTemplate'}
        >
          <Button
            className={'user-button authorization'}
            width={210}
            height={'100%'}
            stylingMode={'text'}
          >
            <UserPanel menuMode={'context'} />
          </Button>
        </Item>
        <Template name={'userPanelTemplate'}>
          <UserPanel menuMode={'list'} />
        </Template> */}
      </Toolbar>
    </header>
)}
