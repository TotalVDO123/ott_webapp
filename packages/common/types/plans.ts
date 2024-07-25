export type AccessControlPlan = {
  id: string;
  exp: number;
};

export type AccessControlPlansParams = {
  siteId: string;
  endpointType: 'plans' | 'entitlements';
  authorization?: string;
};

export type PlansResponse = {
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan[];
  // ...tbd
};
