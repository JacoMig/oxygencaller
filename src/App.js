import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/theme.additional.css';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import './dx-styles.scss';
import LoadPanel from 'devextreme-react/load-panel';
import { NavigationProvider } from './contexts/navigation';
import { AuthProvider, useAuth } from './contexts/auth';
import { useScreenSizeClass } from './utils/media-query';
import Content from './Content';
import UnauthenticatedContent from './UnauthenticatedContent';
import { themes } from "devextreme/ui/themes";
import { MemoryRouter } from "react-router-dom"




function App() {
  const { user, loading } = useAuth();

  //DevExpress.ui.themes.current("generic.dark.compact");
  
  if (loading) {
    return <LoadPanel visible={true} />;
  }

  if (user) {
    return <Content />;
  }

  return <UnauthenticatedContent />;
}

export default function Root() {
  const screenSizeClass = useScreenSizeClass();

  return (
    <MemoryRouter>
      <AuthProvider>
        <NavigationProvider><div className={`app ${screenSizeClass}` }>
            <App />
          </div>
        </NavigationProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}
