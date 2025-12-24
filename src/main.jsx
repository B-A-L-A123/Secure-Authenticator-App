import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from "@react-oauth/google";
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    

    
    <BrowserRouter>
      <GoogleOAuthProvider clientId="356401180182-kou09gidb49a45708i62qadvf2t4grcl.apps.googleusercontent.com">
      <App />
  </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
