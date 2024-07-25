import { ServerResponse } from 'node:http';

import { JWError, JWErrorResponse } from '@jwp/ott-common/types/errors.js';

import { RequestMethod } from './http.js';

/**
 * List of possible error codes based on RFC-JW03-Delivery API
 * https://www.notion.so/jwplayer/RFC-JW03-Delivery-API-fc35c5f5d300445eba4004de970d06b4
 */
export enum ErrorCode {
  BadRequestError = 'bad_request',
  ParameterMissing = 'parameter_missing',
  ParameterInvalid = 'parameter_invalid',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  MethodNotAllowed = 'method_not_allowed',
  InternalError = 'internal_error',
}

const ErrorCodeDescription: Record<ErrorCode, string> = {
  [ErrorCode.BadRequestError]: 'The request was not constructed correctly.',
  [ErrorCode.ParameterMissing]: 'Required parameter {value} is missing.',
  [ErrorCode.ParameterInvalid]: 'Parameter {value} is invalid. {reason}.',
  [ErrorCode.Unauthorized]: 'Missing or invalid auth credentials.',
  [ErrorCode.Forbidden]: 'Access to the requested resource is not allowed.',
  [ErrorCode.NotFound]: 'The requested resource could not be found.',
  [ErrorCode.MethodNotAllowed]: 'The requested resource only supports {value} requests.',
  [ErrorCode.InternalError]: 'An error was encountered while processing the request. Please try again.',
};

/**
 * Allowed response status codes.
 */
export type ErrorStatusCode = 400 | 401 | 403 | 404 | 405 | 500;

/**
 * Base class for errors.
 */
export abstract class AccessBridgeError {
  private readonly descriptionOverride: string | null;

  protected constructor(description?: string) {
    this.descriptionOverride = description || null;
  }

  abstract get code(): ErrorCode;
  abstract get statusCode(): ErrorStatusCode;
  abstract get headers(): Iterable<[string, string]>;
  protected abstract get defaultDescription(): string;

  get description(): string {
    return this.descriptionOverride || this.defaultDescription;
  }
}

/**
 * Factory for generating error classes.
 * @param errorCode - The error code for errors of this type.
 * @param statusCode - The corresponding HTTP status code.
 * @param defaultDescriptionFactory - A function to fill in the default description based on the error context.
 * @param headersFactory - A function to fill in the error response headers based on the error context.
 * @returns a new error class.
 */
function createError<T>(
  errorCode: ErrorCode,
  statusCode: ErrorStatusCode,
  defaultDescriptionFactory: (context: T) => string,
  headersFactory: (context: T) => Iterable<[string, string]> = () => []
): new (context: T & { description?: string }) => AccessBridgeError {
  return class extends AccessBridgeError {
    private readonly context: T;

    constructor(context: T & { description?: string }) {
      super(context?.description);
      this.context = context;
    }

    get code(): ErrorCode {
      return errorCode;
    }

    get statusCode(): ErrorStatusCode {
      return statusCode;
    }

    get headers(): Iterable<[string, string]> {
      return headersFactory(this.context);
    }

    protected get defaultDescription(): string {
      return defaultDescriptionFactory(this.context);
    }
  };
}

/**
 * Retrieves the description for a given error code.
 *
 * This function replaces placeholders in the error description with the provided `value` and `reason`.
 *
 * @param {ErrorCode} code - The error code for which the description is needed.
 * @param {string} [value] - An optional value to replace the `{value}` placeholder in the description.
 * @param {string} [reason] - An optional reason to replace the `{reason}` placeholder in the description.
 * @returns {string} The description corresponding to the error code, with the `{value}` and `{reason}`
 * placeholders replaced by the provided arguments if applicable.
 */
export function getErrorCodeDescription(code: ErrorCode, value?: string, reason?: string): string {
  let description = ErrorCodeDescription[code];

  if (description.includes('{value}')) {
    description = description.replace('{value}', value || '');
  }

  if (description.includes('{reason}')) {
    description = description.replace('{reason}', reason || '');
  }

  return description;
}

/**
 * Send one or more errors.
 *
 * @param res - The response object to send the error to. This ends the response.
 * @param error - The error to send.
 * @param errors - Any other errors to send. Their status code must match error's.
 */
export function sendErrors(res: ServerResponse, error: AccessBridgeError, ...errors: AccessBridgeError[]) {
  // All errors must share the same error code
  const statusCode = error.statusCode;
  if (errors.find((e) => e.statusCode !== statusCode)) {
    throw new Error('All errors must result in the same HTTP status code');
  }

  res.statusCode = statusCode;
  const allErrors = [error, ...errors];
  for (const error of allErrors) {
    for (const header of error.headers) {
      res.setHeader(...header);
    }
  }

  const body = {
    errors: allErrors.map((e) => ({
      code: e.code,
      description: e.description,
    })),
  };

  res.end(JSON.stringify(body));
}

// Define specific errors
export const BadRequestError = createError(ErrorCode.BadRequestError, 400, () =>
  getErrorCodeDescription(ErrorCode.BadRequestError)
);

export const ParameterMissingError = createError<{ parameterName: string }>(
  ErrorCode.ParameterMissing,
  400,
  ({ parameterName }) => getErrorCodeDescription(ErrorCode.ParameterMissing, parameterName)
);

export const ParameterInvalidError = createError<{
  parameterName: string;
  reason?: string;
}>(ErrorCode.ParameterInvalid, 400, ({ parameterName, reason }) =>
  getErrorCodeDescription(ErrorCode.ParameterInvalid, parameterName, reason)
);

export const UnauthorizedError = createError(ErrorCode.Unauthorized, 401, () =>
  getErrorCodeDescription(ErrorCode.Unauthorized)
);

export const ForbiddenError = createError(ErrorCode.Forbidden, 403, () => getErrorCodeDescription(ErrorCode.Forbidden));

export const NotFoundError = createError(ErrorCode.NotFound, 404, () => getErrorCodeDescription(ErrorCode.NotFound));

export const MethodNotAllowedError = createError<{
  allowedMethods: RequestMethod[];
}>(
  ErrorCode.MethodNotAllowed,
  405,
  ({ allowedMethods }) => getErrorCodeDescription(ErrorCode.MethodNotAllowed, allowedMethods.sort().join(', ')),
  ({ allowedMethods }) => [['Allow', allowedMethods.sort().join(', ')]]
);

export const InternalError = createError(ErrorCode.InternalError, 500, () =>
  getErrorCodeDescription(ErrorCode.InternalError)
);

// Type guard to check if the error is a JWErrorResponse
export function isJWError(error: unknown): error is JWErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors) &&
    (error as { errors: unknown[] }).errors.every(
      (e) => typeof (e as JWError).code === 'string' && typeof (e as JWError).description === 'string'
    )
  );
}
