import { Viewer } from '@jwp/ott-common/types/access.js';

import { SIMS_CLIENT } from '../app-config.js';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, isJWError } from '../errors.js';
import { get } from '../http.js';
import logger from '../logger.js';

type AccountResponse = {
  id: number;
  email: string;
};

/**
 * Service class responsible for interacting with the Account API that handles account information.
 */
export class AccountService {
  private simsClient: string;

  constructor() {
    this.simsClient = SIMS_CLIENT;
  }

  /**
   * Retrieves viewer information based on the provided Authorization token.
   *
   * @param authorization The Bearer token used to authenticate the request.
   * @returns A Promise that resolves to an Account object.
   * @throws Error if there is an issue fetching the account information or parsing the response.
   */
  async getAccount({ authorization }: { authorization: string }): Promise<Viewer> {
    try {
      const account = await get<AccountResponse>(`${this.simsClient}/v2/accounts`, authorization);
      if (!account) {
        throw new NotFoundError({ description: 'Account not found.' });
      }

      return {
        id: account.id.toString(),
        email: account.email,
      };
    } catch (e) {
      // @ts-ignore
      // This will be removed once SIMS team addresses the error format for the case
      if (e.code === 401) {
        throw new UnauthorizedError({});
      }
      if (isJWError(e)) {
        const error = e.errors[0];
        switch (error.code) {
          case 'unauthorized':
            throw new UnauthorizedError({ description: error.description });
          case 'forbidden':
            throw new ForbiddenError({ description: error.description });
          case 'not_found':
            throw new NotFoundError({ description: error.description });
          default:
            throw new BadRequestError({ description: error.description });
        }
      }
      logger.error('Service: error fetching account information:', e);
      throw e;
    }
  }
}
