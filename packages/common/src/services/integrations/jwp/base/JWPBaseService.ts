import { injectable } from 'inversify';

type RequestOptions = {
  authenticate?: boolean;
  keepalive?: boolean;
};

@injectable()
export default class JWPBaseService {
  private sandbox = true;

  private siteId = '';

  // private getBaseUrl = () => (this.sandbox ? 'https://staging-v2.inplayer.com' : 'https://services.inplayer.com');
  private getBaseUrl = () => `${this.sandbox ? 'https://services-daily.inplayer.com' : 'https://services.inplayer.com'}/v3/sites/${this.siteId}`;

  private performRequest = async (path: string = '/', method = 'GET', body?: string, options: RequestOptions = {}) => {
    try {
      const resp = await fetch(`${this.getBaseUrl()}${path}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        keepalive: options.keepalive,
        method,
        body,
      });

      return await resp.json();
    } catch (error: unknown) {
      return {
        errors: Array.of(error instanceof Error ? error.message : String(error)),
      };
    }
  };

  setup = (sandbox: boolean, siteId: string) => {
    this.sandbox = sandbox;
    this.siteId = siteId;
  };

  get = <T>(path: string, options?: RequestOptions) => this.performRequest(path, 'GET', undefined, options) as Promise<T>;

  patch = <T>(path: string, body?: string, options?: RequestOptions) => this.performRequest(path, 'PATCH', body, options) as Promise<T>;

  put = <T>(path: string, body?: string, options?: RequestOptions) => this.performRequest(path, 'PUT', body, options) as Promise<T>;

  post = <T>(path: string, body?: string, options?: RequestOptions) => this.performRequest(path, 'POST', body, options) as Promise<T>;

  remove = <T>(path: string, options?: RequestOptions) => this.performRequest(path, 'DELETE', undefined, options) as Promise<T>;
}
