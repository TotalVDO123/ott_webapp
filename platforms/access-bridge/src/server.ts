import { Server as HTTPServer } from 'http';

import express, { Express, Request, Response, NextFunction } from 'express';

import { AccessBridgeError, ErrorDefinitions, sendErrors } from './errors.js';

/**
 * Server class that initializes and manages an Express application with error handling.
 */
export class Server {
  private app: Express;
  private httpServer: HTTPServer | null;
  private address: string;
  private port: number;

  /**
   * Creates an instance of the Server class.
   * @param address - Address to bind the server to
   * @param port - Port to bind the server to
   * @param registerEndpoints - Function to register routes and endpoints
   */
  constructor(address: string, port: number, registerEndpoints: (app: Express) => void) {
    this.app = express();
    this.httpServer = null;
    this.address = address;
    this.port = port;
    this.initialize(registerEndpoints);
  }

  /**
   * Initializes the server with middleware and endpoints.
   * @param registerEndpoints - Function to register routes and endpoints
   */
  private initialize(registerEndpoints: (app: Express) => void) {
    // Middleware for parsing JSON request bodies
    this.app.use(express.json());

    // Register custom endpoints
    registerEndpoints(this.app);

    // Handle 404 Not Found errors
    this.app.use(this.notFoundErrorHandler);

    // Global error handling middleware
    this.app.use(this.globalErrorHandler);
  }

  /**
   * Middleware to handle 404 Not Found errors.
   */
  private notFoundErrorHandler = (req: Request, res: Response, next: NextFunction) => {
    sendErrors(res, ErrorDefinitions.NotFoundError.create());
    return;
  };

  /**
   * Global error handler middleware for the server.
   */
  private globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      sendErrors(res, ErrorDefinitions.ParameterInvalidError.create({ parameterName: 'body' }));
      return;
    }

    if (err instanceof AccessBridgeError) {
      sendErrors(res, err);
      return;
    }

    console.error('Unexpected error:', err);
    sendErrors(res, ErrorDefinitions.InternalError.create());
  };

  /**
   * Starts the server and listens on the specified port.
   * @returns A promise that resolves to the port the server is listening on
   */
  public async listen(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.httpServer = this.app.listen(this.port, this.address, () => {
        this.port = (this.httpServer?.address() as { port: number })?.port || this.port;
        console.info(`Server listening at http://${this.address}:${this.port}`);
        resolve(this.port);
      });

      this.httpServer.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  /**
   * Closes the server connection.
   * @returns A promise that resolves when the server is closed
   */
  public async close(): Promise<void> {
    if (!this.httpServer) {
      return Promise.resolve();
    }
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
