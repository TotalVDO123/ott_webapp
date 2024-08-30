import { inject, injectable } from 'inversify';

import type { Passport } from '../../../../types/passport';
import { JWPAPIServiceToUse } from '../../../constants';
import StorageService from '../../StorageService';

import type { JWPError } from './types';

const INPLAYER_TOKEN_KEY = 'inplayer_token';
const INPLAYER_IOT_KEY = 'inplayer_iot';

const PASSPORT_KEY = 'passport';

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
};

@injectable()
export default class JWPAPIService {
  private readonly storageService: StorageService;

  private service: JWPAPIServiceToUse = JWPAPIServiceToUse.Sims;
  private useSandboxEnv = true;

  static readonly baseUrls = {
    [JWPAPIServiceToUse.Sims]: {
      sandbox: 'https://daily-sims.jwplayer.com',
      prod: 'https://sims.jwplayer.com',
    },
    [JWPAPIServiceToUse.AccessBridge]: {
      sandbox: 'https://access-bridge-57322003213.europe-west1.run.app',
      prod: 'https://access-bridge-url',
    },
  } as const;

  constructor(@inject(StorageService) storageService: StorageService) {
    this.storageService = storageService;
  }

  setup = (useSandboxEnv: boolean, service: JWPAPIServiceToUse = JWPAPIServiceToUse.Sims) => {
    this.useSandboxEnv = useSandboxEnv;
    this.service = service;
  };

  private getBaseUrl = () => {
    const environment = this.useSandboxEnv ? 'sandbox' : 'prod';
    return JWPAPIService.baseUrls[this.service][environment];
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

  setPassport = (passport: string, refreshToken: string) => {
    return this.storageService.setItem(PASSPORT_KEY, JSON.stringify({ passport, refreshToken }), false);
  };

  getPassport = async (): Promise<Passport | null> => {
    return await this.storageService.getItem(PASSPORT_KEY, true, false);
  };

  removePassport = async () => {
    return await this.storageService.removeItem(PASSPORT_KEY);
  };

  isAuthenticated = async () => {
    const tokenObject = await this.getToken();

    return !!tokenObject.token && tokenObject.expires > Date.now() / 1000;
  };

  private performRequest = async (
    path: string = '/',
    method = 'GET',
    body?: Record<string, unknown>,
    { contentType = 'form', responseType = 'json', withAuthentication = false, keepalive, includeFullResponse = false }: RequestOptions = {},
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

    const formData = new URLSearchParams();

    if (body) {
      Object.entries(body).forEach(([key, value]) => {
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
    }

    const endpoint = `${path.startsWith('http') ? path : `${this.getBaseUrl()}${path}`}${
      searchParams ? `?${new URLSearchParams(searchParams as Record<string, string>).toString()}` : ''
    }`;

    const resp = await fetch(endpoint, {
      headers,
      keepalive,
      method,
      body: body && formData.toString(),
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
