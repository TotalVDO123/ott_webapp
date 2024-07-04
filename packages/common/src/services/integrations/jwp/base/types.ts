export type CommonResponse = {
  code: number;
  message: string;
};

export type AccountData = {
  id: number;
  email: string;
  full_name: string;
  referrer: string;
  metadata: Record<string, unknown>;
  social_apps_metadata: Record<string, unknown>[];
  roles: string[];
  completed: boolean;
  created_at: number;
  updated_at: number;
  date_of_birth: number;
  uuid: string;
  merchant_uuid: string;
};

export type CreateAccount = {
  access_token: string;
  expires: number;
  account: AccountData;
};

export type RegisterFieldOptions = Record<string, string>;

export type RegisterField = {
  id: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  default_value: string;
  placeholder: string;
  options: RegisterFieldOptions;
};

export type GetRegisterFieldsResponse = {
  collection: RegisterField[];
};

type CollectionWithCursor<T> = {
  collection: T[];
  cursor?: string;
};

export type WatchHistory = {
  media_id: string;
  progress: number;
  created_at: number;
  updated_at: number;
};

export type GetWatchHistoryResponse = CollectionWithCursor<WatchHistory>;

export type FavoritesData = {
  media_id: string;
  created_at: number;
};

export type GetFavoritesResponse = CollectionWithCursor<FavoritesData>;

export type SocialURLs = {
  facebook: string;
  twitter: string;
  google: string;
};

export type ListSocialURLs = {
  social_urls: SocialURLs[];
  code: number;
};

export type SignedMediaResponse = {
  token: string;
};
