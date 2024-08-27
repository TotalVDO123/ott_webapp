import React from 'react';
import { useAccountStore } from '@jwp/ott-common/src/stores/AccountStore';

import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import Subscription from '../../components/Subscription/Subscription';

const SubscriptionContainer: React.FC = () => {
  const { subscription, loading: isAccountLoading } = useAccountStore();

  if (isAccountLoading) {
    return <LoadingOverlay transparentBackground />;
  }

  return <Subscription subscription={subscription} />;
};

export default SubscriptionContainer;
