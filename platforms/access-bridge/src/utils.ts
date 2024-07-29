import { IncomingMessage } from 'node:http';

import jwt, { JwtPayload } from 'jsonwebtoken';
import { Viewer } from '@jwp/ott-common/types/access.js';

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

/**
 * Checks if the required parameters are present in the provided object.
 * @param params - The object containing the parameters to be validated.
 * @param requiredParams - The list of required keys to check for presence.
 * @returns An array of missing required keys.
 */
export const validateBodyParams = <T>(params: Partial<T>, requiredParams: (keyof T)[]): (keyof T)[] => {
  // Filter out keys that are required but missing or undefined
  const missingParams = requiredParams.filter(
    (key) => !(key in params) || params[key] === undefined || params[key] === ''
  );

  return missingParams;
};

/**
 * Parses a bearer token to extract the viewer's ID and email.
 *
 * @param token - The bearer token to be parsed.
 * @returns An object containing the viewer's ID and email, or null if the token is invalid or missing required fields.
 */
export function parseBearerToken(token: string): Viewer | null {
  try {
    const strippedToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.decode(strippedToken) as JwtPayload;

    // Check if the decoded token has the required fields
    if (decoded && typeof decoded === 'object' && 'aid' in decoded && 'sub' in decoded) {
      const { aid, sub } = decoded;
      return { id: aid, email: sub } as Viewer;
    } else {
      console.error('Token does not contain the required fields');
      return null;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
