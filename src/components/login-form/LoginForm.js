import React, { useState, useRef, useCallback, useEffect, useHistory  } from 'react';
import { Link, useNavigate, useSearchParams, useLocation, useQuery  } from 'react-router-dom';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
  EmailRule
} from 'devextreme-react/form';
import $ from "jquery"
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { useAuth } from '../../contexts/auth';

import './LoginForm.scss';

export default function LoginForm() {

  //const [searchParams, setSearchParams] = useSearchParams();
  //const useQuery = () => new URLSearchParams(useLocation().search);
  const myParam = useLocation().search;
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const formData = useRef({ name: '', code: '' });

  useEffect(()=>{
    
    const siteUrl = window.location.search;

    //console.log("siteUrl: ", siteUrl);
    const urlSearchParms= new URLSearchParams(siteUrl);
    var id= urlSearchParms.get("id");
    //console.log("ID: ", id);
    if(id==="" || id===0 || id===null)
      formData.current = { name: '', code: '' };
    else
      formData.current= { name: '', code: id.toString() }
      console.log("document.title: ", window.location.origin)
      window.history.replaceState({}, window.location.origin)
    forceUpdate();

  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { name, code } = formData.current;
    setLoading(true);

    const result = await signIn(name, code);
    if (!result.isOk) {
      setLoading(false);
      notify(result.message, 'error', 2000);
    }
  }, [signIn]);

  const onCreateAccountClick = useCallback(() => {
    navigate('/create-account');
  }, [navigate]);


  return (
    <form onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
        <Item
          dataField={'name'}
          editorType={'dxTextBox'}
          // editorOptions={emailEditorOptions}
        >
          <RequiredRule message="Name is required" />
          {/* <EmailRule message="Email is invalid" /> */}
          <Label visible={true}>Name</Label>
        </Item>
        <Item
          id="txtCode"
          dataField={'code'}
          editorType={'dxTextBox'}
          // editorOptions={passwordEditorOptions}
        >
          <RequiredRule message="Code is required" />
          <Label visible={true}>Call ID</Label>
        </Item>
        <ButtonItem>
          <ButtonOptions
            width={'100%'}
            type={'default'}
            useSubmitBehavior={true}
          >
            <span className="dx-button-text">
              {
                loading
                  ? <LoadIndicator width={'24px'} height={'24px'} visible={true} />
                  : 'Join call'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>
    </form>
  );
}

