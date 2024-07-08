import type { CommonResponse } from '../services/integrations/jwp/types';

export class ApiError extends Error {
  code: number;
  message: string;

  constructor(message = '', code: number) {
    super(message);
    this.name = 'ApiError';
    this.message = message;
    this.code = code;
  }
}

/**
 * Get data
 * @param response
 */
export const getDataOrThrow = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    const message = `Request '${response.url}' failed with ${response.status}`;
    const apiMessage = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : undefined;

    throw new ApiError(apiMessage || message, response.status || 500);
  }

  return data;
};

export const getCommonResponseData = (response: { data: CommonResponse }) => {
  const { code, message } = response.data;
  if (code !== 200) {
    throw new Error(message);
  }
  return {
    errors: [],
    responseData: {
      message,
      code,
    },
  };
};
