import React from 'react';
import { useMatch } from 'react-router';
import usePlansForMedia from '@jwp/ott-hooks-react/src/usePlansForMedia';
import LoadingOverlay from '@jwp/ott-ui-react/src/components/LoadingOverlay/LoadingOverlay';
import { PATH_MEDIA } from '@jwp/ott-common/src/paths';

import ListPlans from '../../components/ListPlans/ListPlans';

export default function ListPlansContainer() {
  const match = useMatch(PATH_MEDIA);

  const mediaId = match?.params.id || '';

  const { isLoading, data: plans = [] } = usePlansForMedia(mediaId);

  if (isLoading) {
    return (
      <div style={{ height: 300 }}>
        <LoadingOverlay inline />
      </div>
    );
  }

  return <ListPlans plans={plans} />;
}
