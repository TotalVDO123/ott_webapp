export type AccessControlPlan = {
  id: string;
  exp: number;
};

export type PlansResponse = {
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan[];
};
