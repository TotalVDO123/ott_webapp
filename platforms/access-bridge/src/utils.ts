import { IncomingMessage } from 'node:http';

import { BadRequestError } from './errors.js';

export function isValidSiteId(siteId: string): boolean {
  // Regular expression to match exactly 8 alphanumeric characters
  const alphanumericRegex = /^[a-zA-Z0-9]{8}$/;
  return alphanumericRegex.test(siteId);
}

// parse request body provided in an API call
export const parseJsonBody = <T>(req: IncomingMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch (error) {
        if (error instanceof Error) {
          reject(new BadRequestError({ description: error.message }));
        }
        reject(new BadRequestError({ description: 'Invalid JSON provided.' }));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
};
