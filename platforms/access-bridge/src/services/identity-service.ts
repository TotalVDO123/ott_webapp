import { SIMS_API_HOST } from '../app-config.js';
import { ErrorDefinitions, handleJWError, isJWError } from '../errors.js';
import { get } from '../http.js';
import logger from '../logger.js';

export type Viewer = {
  id: string;
  email: string;
};

/**
 * Service class responsible for interacting with the Account API that handles identity information.
 */
export class IdentityService {
  /**
   * Retrieves viewer information based on the provided Authorization token.
   *
   * @param authorization The Bearer token used to authenticate the request.
   * @returns A Promise that resolves to an Account object.
   * @throws Error if there is an issue fetching the account information or parsing the response.
   */
  async getAccount({ authorization }: { authorization: string }): Promise<Viewer> {
    try {
      const account = await get<Viewer>(`${SIMS_API_HOST}/v3/accounts`, authorization);
      if (!account) {
        throw ErrorDefinitions.NotFoundError.create({ description: 'Account not found.' });
      }

      return {
        id: account.id.toString(),
        email: account.email,
      };
    } catch (e) {
      if (isJWError(e)) {
        const error = e.errors[0];
        handleJWError(error);
      }
      logger.error('IdentityService: getAccount: error fetching account information', e);
      throw e;
    }
  }
}
