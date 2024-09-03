import { inject, injectable } from 'inversify';

import type { Passport } from '../../types/passport';

import StorageService from './StorageService';

const PASSPORT_KEY = 'passport';

@injectable()
export default class AccessService {
  private readonly storageService: StorageService;

  constructor(@inject(StorageService) storageService: StorageService) {
    this.storageService = storageService;
  }

  generatePassport = async (host: string, siteId: string, jwt?: string): Promise<Passport | null> => {
    if (!siteId) {
      throw new Error('Site ID is required');
    }

    const pathname = `/v2/sites/${siteId}/access/generate`;
    const url = `${host}${pathname}`;

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
    const expires = new Date(Date.now() + 3600 * 1000).getTime(); // Set expiration time to one hour from now
    return this.storageService.setItem(PASSPORT_KEY, JSON.stringify({ ...passport, expires }), true);
  };

  getPassport = async (): Promise<(Passport & { expires: string }) | null> => {
    return await this.storageService.getItem(PASSPORT_KEY, true, true);
  };

  removePassport = async () => {
    return await this.storageService.removeItem(PASSPORT_KEY);
  };
}
