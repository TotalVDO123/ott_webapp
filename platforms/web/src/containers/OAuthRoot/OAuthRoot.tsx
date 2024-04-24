import React from 'react';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { shallow } from '@jwp/ott-common/src/utils/compare';
import { isTruthyCustomParamValue } from '@jwp/ott-common/src/utils/common';
import { ACCESS_MODEL } from '@jwp/ott-common/src/constants';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';
import { AuthProvider, getOAuthConfig, getOAuthUserResource, useOAuth } from '@jwp/ott-hooks-react/src/useOAuth';
import env from '@jwp/ott-common/src/env';

type OAuthProviderProps = {
  children: React.ReactNode;
};

const OAuthProvider: React.FC<OAuthProviderProps> = ({ children }) => {
  const { pathname } = useLocation();
  const { token } = useOAuth();
  React.useEffect(() => {
    useConfigStore.setState({
      accessModel: ACCESS_MODEL.AUTHVOD,
    });
    (async () => {
      const user = token ? await getOAuthUserResource(`Bearer ${token}`) : null;
      useAccountStore.setState({
        user,
        loading: false,
      });
    })();
  }, [token, pathname]);

  return children;
};

const OAuthRoot: React.FC<OAuthProviderProps> = ({ children }) => {
  const { isOAuthMode } = useConfigStore(({ config }) => ({ isOAuthMode: isTruthyCustomParamValue(config.custom?.isOAuthMode) }), shallow);

  if (isOAuthMode) {
    return (
      <AuthProvider authConfig={getOAuthConfig(env)}>
        <OAuthProvider>{children}</OAuthProvider>
      </AuthProvider>
    );
  }
  return children;
};

export default OAuthRoot;
