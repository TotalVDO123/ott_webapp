import { inject, injectable } from 'inversify';

import env from '../env';
import type { Passport } from '../../types/passport';

import StorageService from './StorageService';

const PASSPORT_KEY = 'passport';

@injectable()
export default class AccessService {
  private readonly storageService: StorageService;

  constructor(@inject(StorageService) storageService: StorageService) {
    this.storageService = storageService;
  }

  generatePassport = async (siteId: string, jwt?: string): Promise<Passport | null> => {
    if (!siteId) {
      throw new Error('Site ID is required');
    }

    const pathname = `/v2/sites/${siteId}/access/generate`;
    const url = `${env.APP_API_ACCESS_BRIDGE_URL}${pathname}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: jwt ? `Bearer ${jwt}` : '',
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Passport;
  };

  setPassport = (passport: Passport) => {
    return this.storageService.setItem(PASSPORT_KEY, JSON.stringify(passport), true);
  };

  getPassport = async (): Promise<Passport | null> => {
    return await this.storageService.getItem(PASSPORT_KEY, true, true);
  };

  removePassport = async () => {
    return await this.storageService.removeItem(PASSPORT_KEY);
  };
}
