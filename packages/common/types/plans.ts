type AccessOptions = {
  drm_policy_id: string;
  tags: {
    include: string[];
    exclude: string[];
  };
};

type AccessControlPlanExternalProviders = {
  stripe?: string;
  apple?: string;
  google?: string;
};

export type AccessControlPlan = {
  id: string;
  exp: number;
  external_providers?: AccessControlPlanExternalProviders;
};

export type Plan = {
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan;
  access: AccessOptions;
  metadata: {
    external_providers: AccessControlPlanExternalProviders;
  };
};

export type PlansResponse = {
  total: number;
  page: number;
  page_length: number;
  plans: Plan[];
};
