const getBrowserOrigin = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin;
};

export const resolveRedirectUri = () => {
  const configuredRedirect = import.meta.env.VITE_COGNITO_REDIRECT_URI;

  if (import.meta.env.DEV) {
    const localOverride = import.meta.env.VITE_COGNITO_REDIRECT_URI_LOCAL;
    const fallback = getBrowserOrigin();

    if (localOverride) {
      return localOverride;
    }

    if (fallback) {
      return fallback;
    }
  }

  if (configuredRedirect) {
    return configuredRedirect;
  }

  const browserOrigin = getBrowserOrigin();

  if (browserOrigin) {
    return browserOrigin;
  }

  throw new Error('Unable to resolve redirect URI. Please set VITE_COGNITO_REDIRECT_URI.');
};

export const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_DOMAIN,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: resolveRedirectUri(),
  post_logout_redirect_uri: resolveRedirectUri(),
  response_type: 'code',
  scope: 'aws.cognito.signin.user.admin email openid phone profile',
};
