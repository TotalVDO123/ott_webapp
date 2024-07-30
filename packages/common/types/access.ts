import type { AccessControlPlan } from './plans';

export type GenerateAccessTokensParams = {
  siteId: string;
  viewerId: string;
  plans: AccessControlPlan[];
};

export type RefreshAccessTokensParams = {
  siteId: string;
  refreshToken: string;
};

export type AccessTokensResponse = {
  passport: string;
  refresh_token: string;
};

export type Viewer = {
  id: number;
  email: string;
};
