import { inject, injectable } from 'inversify';

import StorageService from '../../../StorageService';

const INPLAYER_TOKEN_KEY = 'inplayer_token';
const INPLAYER_IOT_KEY = 'inplayer_iot';

type RequestOptions = {
  withAuthentication?: boolean;
  keepalive?: boolean;
  json?: boolean;
  includeStatus?: boolean;
};

@injectable()
export default class JWPAPIService {
  private readonly storageService: StorageService;

  private sandbox = true;

  siteId = '';

  constructor(@inject(StorageService) storageService: StorageService) {
    this.storageService = storageService;
  }

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
    const token = await this.getToken();

    return !!token.token && token.expires > Date.now() / 1000;
  };

  private getBaseUrl = () => (this.sandbox ? 'https://staging-v2.inplayer.com' : 'https://services.inplayer.com');

  private performRequest = async (path: string = '/', method = 'GET', body?: Record<string, unknown>, { json = false, ...options }: RequestOptions = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded',
    };

    if (options.withAuthentication) {
      const tokenObject = await this.getToken();

      if (tokenObject.token) {
        headers.Authorization = `Bearer ${tokenObject.token}`;
      }
    }

    const _body =
      body &&
      Object.entries(body)
        .map(([key, value]) =>
          key && (value || value === 0)
            ? `${key}=${typeof value === 'string' ? encodeURIComponent(value) : value}` ||
              Object.entries(value)
                .map(([subkey, subval]) => `${key}[${subkey}]=${encodeURIComponent(subval)}`)
                .join('&')
            : '',
        )
        .filter(Boolean)
        .join('&');

    const resp = await fetch(`${this.getBaseUrl()}${path}`, {
      headers,
      keepalive: options.keepalive,
      method,
      body: _body,
    });

    const resJson = await resp.json();

    if (!resp.ok) {
      throw { response: { data: resJson } };
    }

    if (options.includeStatus) {
      return { status: resp.status, data: resJson };
    }

    return resJson;
  };

  setup = (sandbox: boolean, siteId: string) => {
    this.sandbox = sandbox;
    this.siteId = siteId;
  };

  get = <T>(path: string, options?: RequestOptions) => this.performRequest(path, 'GET', undefined, options) as Promise<T>;

  patch = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'PATCH', body, options) as Promise<T>;

  put = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'PUT', body, options) as Promise<T>;

  post = <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) => this.performRequest(path, 'POST', body, options) as Promise<T>;

  remove = <T>(path: string, options?: RequestOptions, body?: Record<string, unknown>) => this.performRequest(path, 'DELETE', body, options) as Promise<T>;
}
