type AccessOptions = {
  drm_policy_id: string;
  include_tags: string[] | null;
  exclude_tags: string[] | null;
  include_custom_params: string[] | null;
  exclude_custom_params: string[] | null;
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
  name: string;
  access_model: 'free' | 'freeauth' | 'svod';
  access_plan: AccessControlPlan;
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
