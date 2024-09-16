type AccessOptions = {
  drm_policy_id: string;
};

type PlanExternalProviders = {
  stripe?: string;
  apple?: string;
  google?: string;
};

export type AccessControlPlan = {
  id: string;
  exp: number;
};

export type Plan = {
  id: string;
  exp: number;
  access_model: 'free' | 'freeauth' | 'svod';
  access: AccessOptions;
  metadata: {
    external_providers: PlanExternalProviders;
  };
};

export type PlansResponse = {
  total: number;
  page: number;
  page_length: number;
  plans: Plan[];
};
