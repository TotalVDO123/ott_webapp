import React from 'react';

import Button from '../Button/Button';

import styles from './ListPlans.module.scss';

const ListPlans: React.FC = () => {
  return (
    <div className={styles.welcome}>
      <h2>list plans</h2>
      <div>boxes</div>
      <Button variant="contained" color="primary" label={'Go to Account settings'} onClick={() => {}} size="large" fullWidth />
    </div>
  );
};

export default ListPlans;
