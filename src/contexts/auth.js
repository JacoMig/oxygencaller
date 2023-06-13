import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { getUser, signIn as sendSignInRequest } from '../api/auth';


function AuthProvider(props) {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function () {
      const result = await getUser();
      if (result.isOk) {
        setUser(result.data);
      }

      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk) {
      setUser(result.data);
    }

    return result;
  }, []);

  const signOut = useCallback(() => {
    try {

      // For modern browsers except IE:
      var event = new CustomEvent('loggingOff', null);
  
  } catch(err) {
  
    // If IE 11 (or 10 or 9...?) do it this way:
  
      // Create the event.
      var event = document.createEvent('Event');
      // Define that the event name is 'build'.
      event.initEvent('loggingOff', true, true);
  
  }
  
  // Dispatch/Trigger/Fire the event
  document.dispatchEvent(event);
    setUser(undefined);
  }, []);

  var webrtc=null;

  
  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }} {...props} />
  );
}

const AuthContext = createContext({ loading: false });
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth }
