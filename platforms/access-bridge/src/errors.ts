import Stripe from 'stripe';
import { Response } from 'express';
import { JWError, JWErrorResponse } from '@jwp/ott-common/types/errors.js';

// Define types for error codes and status codes
export type ErrorCode = keyof typeof ErrorDefinitions;
export type ErrorStatusCode = (typeof ErrorDefinitions)[ErrorCode]['statusCode'];

// Define context types for each error
interface BaseContext {
  description?: string;
}

interface ParameterMissingContext extends BaseContext {
  parameterName: string;
}

interface ParameterInvalidContext extends BaseContext {
  parameterName: string;
  reason?: string;
}

// Unified Error Definitions with details and creation functions
export const ErrorDefinitions = {
  BadRequestError: {
    code: 'bad_request',
    statusCode: 400,
    description: 'The request was not constructed correctly.',
    create: (context?: BaseContext) => new AccessBridgeError('BadRequestError', context),
  },
  ParameterMissingError: {
    code: 'parameter_missing',
    statusCode: 400,
    description: 'Required parameter {value} is missing.',
    create: (context: Partial<ParameterMissingContext>) =>
      new AccessBridgeError('ParameterMissingError', {
        ...context,
        description: `Required parameter ${context.parameterName || ''} is missing.`,
      }),
  },
  ParameterInvalidError: {
    code: 'parameter_invalid',
    statusCode: 400,
    description: 'Parameter {value} is invalid.{reason}',
    create: (context: Partial<ParameterInvalidContext>) => {
      const parameterName = context.parameterName || '';
      const reason = context.reason ? ` ${context.reason}.` : '';
      return new AccessBridgeError('ParameterInvalidError', {
        ...context,
        description: `Parameter ${parameterName} is invalid.${reason}`,
      });
    },
  },
  UnauthorizedError: {
    code: 'unauthorized',
    statusCode: 401,
    description: 'Missing or invalid auth credentials.',
    create: (context?: BaseContext) => new AccessBridgeError('UnauthorizedError', context),
  },
  ForbiddenError: {
    code: 'forbidden',
    statusCode: 403,
    description: 'Access to the requested resource is not allowed.',
    create: (context?: BaseContext) => new AccessBridgeError('ForbiddenError', context),
  },
  NotFoundError: {
    code: 'not_found',
    statusCode: 404,
    description: 'The requested resource could not be found.',
    create: (context?: BaseContext) => new AccessBridgeError('NotFoundError', context),
  },
  MethodNotAllowedError: {
    code: 'method_not_allowed',
    statusCode: 405,
    description: 'The used HTTP method is not supported on the given resource.',
    create: (context?: BaseContext) => new AccessBridgeError('MethodNotAllowedError', context),
  },
  InternalError: {
    code: 'internal_error',
    statusCode: 500,
    description: 'An error was encountered while processing the request. Please try again.',
    create: (context?: BaseContext) => new AccessBridgeError('InternalError', context),
  },
} as const;

// Create the base class for errors
export class AccessBridgeError extends Error {
  private readonly errorKey: keyof typeof ErrorDefinitions;
  private readonly context?: BaseContext;

  constructor(errorKey: keyof typeof ErrorDefinitions, context?: BaseContext) {
    super();
    this.errorKey = errorKey;
    this.context = context;
  }

  get code(): string {
    return ErrorDefinitions[this.errorKey].code;
  }

  get statusCode(): ErrorStatusCode {
    return ErrorDefinitions[this.errorKey].statusCode;
  }

  protected get defaultDescription(): string {
    return ErrorDefinitions[this.errorKey].description;
  }

  get description(): string {
    return this.context?.description || this.defaultDescription;
  }
}

// Send one or more errors
export function sendErrors(res: Response, error: AccessBridgeError): void {
  const statusCode = error.statusCode;

  // Set the response status code
  res.status(statusCode);

  // Construct and send the JSON response body
  const body = {
    errors: [
      {
        code: error.code,
        description: error.description,
      },
    ],
  };

  res.json(body);
}

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

// Utility function to handle JW errors
export function handleJWError(error: JWError): AccessBridgeError {
  const { code, description } = error;
  const errorDefinition = Object.keys(ErrorDefinitions).find((key) => ErrorDefinitions[key as ErrorCode].code === code);
  if (errorDefinition) {
    throw ErrorDefinitions[errorDefinition as ErrorCode].create({ description });
  }

  // Fallback to a generic BadRequestError if no specific match is found
  throw ErrorDefinitions.BadRequestError.create({ description });
}

// Utility function to handle Stripe errors
export function handleStripeError(error: Stripe.errors.StripeError): AccessBridgeError {
  if (error.type === 'StripeInvalidRequestError') {
    throw ErrorDefinitions.BadRequestError.create({ description: error.message });
  } else if (error.type === 'StripeAuthenticationError') {
    throw ErrorDefinitions.UnauthorizedError.create({ description: error.message });
  } else if (error.type === 'StripePermissionError') {
    throw ErrorDefinitions.ForbiddenError.create({ description: error.message });
  }

  // Fallback to a generic BadRequestError for unexpected Stripe errors
  throw ErrorDefinitions.BadRequestError.create({ description: error.message });
}
