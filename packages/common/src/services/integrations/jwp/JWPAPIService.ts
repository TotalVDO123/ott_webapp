import { inject, injectable } from 'inversify';

import StorageService from '../../StorageService';

import { API_CONSTS } from './constants';
import type { JWPError } from './types';

const INPLAYER_TOKEN_KEY = 'inplayer_token';
const INPLAYER_IOT_KEY = 'inplayer_iot';

const CONTENT_TYPES = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
};

type RequestOptions = {
  withAuthentication?: boolean;
  keepalive?: boolean;
  contentType?: keyof typeof CONTENT_TYPES;
  responseType?: 'json' | 'blob';
  includeFullResponse?: boolean;
  fromSimsClient?: boolean;
  forSiteId?: boolean;
};

@injectable()
export default class JWPAPIService {
  private readonly storageService: StorageService;

  private useSandboxEnv = true;
  private siteId = '';

  constructor(@inject(StorageService) storageService: StorageService) {
    this.storageService = storageService;
  }

  setup = (useSandboxEnv: boolean, siteId: string) => {
    this.useSandboxEnv = useSandboxEnv;
    this.siteId = siteId;
  };

  private getBaseUrl = (fromSimsClient = false, forSiteId?: boolean) => {
    const { API_BASE_URL, MIDDLEWARE_BASE_URL, MIDDLEWARE_SITE_BASE_URL } = API_CONSTS[this.useSandboxEnv ? 'DAILY' : 'PROD'];

    if (fromSimsClient) {
      return forSiteId ? MIDDLEWARE_SITE_BASE_URL(this.siteId) : MIDDLEWARE_BASE_URL;
    }

    return API_BASE_URL;
  };

  setToken = (token: string, refreshToken = '', expires: number) => {
    return this.storageService.setItem(INPLAYER_TOKEN_KEY, JSON.stringify({ token, refreshToken, expires }), false);
  };

  getToken = async () => {
    const tokenObject = await this.storageService.getItem(INPLAYER_TOKEN_KEY, true, false);

    if (tokenObject) {
      return tokenObject as { token: string; refreshToken: string; expires: number };
    }

    return { token: '', refreshToken: '', expires: 0 };
  };

  removeToken = async () => {
    await Promise.all([this.storageService.removeItem(INPLAYER_TOKEN_KEY), this.storageService.removeItem(INPLAYER_IOT_KEY)]);
  };

  isAuthenticated = async () => {
    const tokenObject = await this.getToken();

    return !!tokenObject.token && tokenObject.expires > Date.now() / 1000;
  };

  private performRequest = async (
    path: string = '/',
    method = 'GET',
    bodyObject?: Record<string, unknown>,
    {
      contentType = 'form',
      responseType = 'json',
      withAuthentication = false,
      keepalive,
      includeFullResponse = false,
      fromSimsClient = false,
      forSiteId = false,
    }: RequestOptions = {},
    searchParams?: Record<string, string | number>,
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': CONTENT_TYPES[contentType],
    };

    if (withAuthentication) {
      const tokenObject = await this.getToken();

      if (tokenObject.token) {
        headers.Authorization = `Bearer ${tokenObject.token}`;
      }
    }

    const body = (() => {
      if (!bodyObject) return;

      if (contentType === 'json') {
        return JSON.stringify(bodyObject);
      }

      const formData = new URLSearchParams();

      Object.entries(bodyObject).forEach(([key, value]) => {
        if (value || value === 0) {
          if (typeof value === 'object') {
            Object.entries(value as Record<string, string | number>).forEach(([innerKey, innerValue]) => {
              formData.append(`${key}[${innerKey}]`, innerValue.toString());
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return formData.toString();
    })();

    const endpoint = `${path.startsWith('http') ? path : `${this.getBaseUrl(fromSimsClient, forSiteId)}${path}`}${
      searchParams ? `?${new URLSearchParams(searchParams as Record<string, string>).toString()}` : ''
    }`;

    const resp = await fetch(endpoint, {
      headers,
      keepalive,
      method,
      body,
    });

    const resParsed = await resp[responseType]?.();

    if (!resp.ok) {
      throw { response: { data: resParsed } };
    }

    if (includeFullResponse) {
      return { ...resp, data: resParsed };
    }

    return resParsed;
  };

  get = <T>(path: string, options?: RequestOptions, searchParams?: Record<string, string | number>) =>
    this.performRequest(path, 'GET', undefined, options, searchParams) as Promise<T>;

  patch = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'PATCH', body, options) as Promise<T>;

  put = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'PUT', body, options) as Promise<T>;

  post = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'POST', body, options) as Promise<T>;

  remove = <T>(path: string, options?: RequestOptions, body?: Record<string, unknown>) => this.performRequest(path, 'DELETE', body, options) as Promise<T>;

  static isCommonError = (error: unknown): error is JWPError => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as JWPError).response?.data?.code === 'number' &&
      typeof (error as JWPError).response?.data?.message === 'string'
    );
  };
}
