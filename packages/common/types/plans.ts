export type AccessControlPlanExternalProviders = {
  stripe?: string;
  apple?: string;
  google?: string;
};

export type AccessControlPlan = {
  id: string;
  exp: number;
  external_providers?: AccessControlPlanExternalProviders;
};

export type AccessControlPlansParams = {
  siteId: string;
  endpointType: 'plans' | 'entitlements';
  authorization?: string;
};

export type Plans = {
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan;
  metadata: {
    external_providers: AccessControlPlanExternalProviders;
  };
  // ...tbd
};

export type PlansResponse = {
  total: number;
  page: number;
  page_length: number;
  plans: Plans[];
};
