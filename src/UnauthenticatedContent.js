import { Routes, Route, Navigate } from 'react-router-dom';
import { SingleCard } from './layouts';
import { LoginForm, ResetPasswordForm, ChangePasswordForm, CreateAccountForm } from './components';
import appInfo from './app-info';
import { Header, SideNavigationMenu, Footer } from './components';
import logo from './img/LogoAxel.svg'
import routes from './app-routes';
import { SideNavOuterToolbar as SideNavBarLayout } from './layouts';

export default function UnauthenticatedContent() {
  return (
    <SideNavBarLayout title={appInfo.title}>
      <div className={'side-nav-outer-toolbar'}>
        <Routes>
          <Route
            path='/login' 
            element={
              <div>
                <br/>
                <SingleCard >
                    <img src={logo}/>
                    <LoginForm />
                </SingleCard>
              </div>
            }
          />
          <Route path='*' element={<Navigate to={'/login'} />}></Route>
        </Routes>
      </div>
    </SideNavBarLayout>

  );
}
