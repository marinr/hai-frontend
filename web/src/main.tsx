import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App';
import './index.css';

import { cognitoAuthConfig } from '@/utils/authConfig';

const Root = () => (
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  import.meta.env.DEV ? (
    // Strict mode double-mounts components which breaks the OIDC state machine in development.
    <Root />
  ) : (
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  ),
);
