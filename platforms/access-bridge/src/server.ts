import { Server as HTTPServer, IncomingMessage, ServerResponse, createServer } from 'http';

import { EndpointHandler } from './endpoints.js';
import { InternalError, MethodNotAllowedError, NotFoundError, AccessBridgeError, sendErrors } from './errors.js';
import { ALLOWED_REQUEST_METHODS, RequestMethod } from './http.js';

export class Server {
  private httpServer: HTTPServer | null;
  private address: string;
  private port: number;
  private endpointsHandler: EndpointHandler;

  constructor(address: string, port: number, endpointsHandler: EndpointHandler) {
    this.httpServer = null;
    this.address = address;
    this.port = port;
    this.endpointsHandler = endpointsHandler;
  }

  public async listen(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
          await this.handleRequest(req, res);
        } catch (e) {
          sendErrors(res, new InternalError({}));
        }
      });

      server.on('error', (err: Error) => {
        reject(err);
      });

      server.listen(this.port, this.address, () => {
        this.httpServer = server;
        this.port = (server.address() as { port: number }).port;
        resolve(this.port);
      });
    });
  }

  public async close(): Promise<void> {
    if (this.httpServer) {
      return new Promise((resolve, reject) => {
        this.httpServer?.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.validateRequest(req, res);
    } catch (e) {
      if (e instanceof AccessBridgeError) {
        return sendErrors(res, e);
      }
      sendErrors(res, new InternalError({}));
    }
  }

  private async validateRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!req.method || !(ALLOWED_REQUEST_METHODS as readonly string[]).includes(req.method)) {
      return sendErrors(res, new MethodNotAllowedError({ allowedMethods: [...ALLOWED_REQUEST_METHODS] }));
    }

    if (!req.url) {
      return sendErrors(res, new NotFoundError({}));
    }

    // Iterate through registered endpoint patterns
    const requestedMethod = req.method.toUpperCase();
    for (const endpointPattern in this.endpointsHandler) {
      const params = this.extractParams(endpointPattern, req.url);
      if (params) {
        const endpoint = this.endpointsHandler[endpointPattern];
        const methodHandler = endpoint[requestedMethod];
        if (methodHandler) {
          await methodHandler(req, res, params);
          return;
        } else {
          return sendErrors(
            res,
            new MethodNotAllowedError({ allowedMethods: Object.keys(endpoint) as RequestMethod[] })
          );
        }
      }
    }

    return sendErrors(res, new NotFoundError({}));
  }

  // Extract params from URL
  private extractParams(pattern: string, url: string): { [key: string]: string } | null {
    const patternParts = pattern.split('/');
    const urlParts = url.split('/');

    if (patternParts.length !== urlParts.length) {
      return null;
    }

    const params: { [key: string]: string } = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const urlPart = urlParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = urlPart;
      } else if (patternPart !== urlPart) {
        return null;
      }
    }

    return params;
  }
}
