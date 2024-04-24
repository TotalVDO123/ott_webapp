import React from 'react';

import Button from '../Button/Button';

type OAuthBackToAccountButtonProps = {
  targetUrl: string;
};

const OAuthBackToAccountButton: React.FC<OAuthBackToAccountButtonProps> = ({ targetUrl }) => {
  const backToAccButtonClickHandler = () => {
    window.location.replace(targetUrl || '/');
  };
  return <Button onClick={backToAccButtonClickHandler} label="Back to account" fullWidth />;
};

export default OAuthBackToAccountButton;
