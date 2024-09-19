import type { Plan } from '../../types/plans';

import { createStore } from './utils';

type AccessStore = {
  passport: string | null;
  entitledPlan: Plan | null;
};

export const useAccessStore = createStore<AccessStore>('AccessStore', () => ({
  passport: null,
  entitledPlan: null,
}));
