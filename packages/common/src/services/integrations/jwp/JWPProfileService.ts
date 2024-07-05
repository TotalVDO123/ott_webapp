import { inject, injectable } from 'inversify';
import defaultAvatar from '@jwp/ott-theme/assets/profiles/default_avatar.png';

import ProfileService from '../ProfileService';
import StorageService from '../../StorageService';
import type { CreateProfile, DeleteProfile, EnterProfile, GetProfileDetails, ListProfiles, UpdateProfile } from '../../../../types/profiles';
import { logError } from '../../../logger';

import JWPAPIService from './base/JWPAPIService';
import type { ProfilesData } from './base/types';

@injectable()
export default class JWPProfileService extends ProfileService {
  private readonly storageService;
  private readonly apiService;

  constructor(storageService: StorageService, @inject(JWPAPIService) apiService: JWPAPIService) {
    super();
    this.storageService = storageService;
    this.apiService = apiService;
  }

  listProfiles: ListProfiles = async () => {
    try {
      const data = await this.apiService.get<ProfilesData[]>('/v2/accounts/profiles', { withAuthentication: true });

      return {
        canManageProfiles: true,
        collection:
          data.map((profile) => ({
            ...profile,
            avatar_url: profile?.avatar_url || defaultAvatar,
          })) ?? [],
      };
    } catch (error: unknown) {
      logError('JWPProfileService', 'Unable to list profiles', { error });
      return {
        canManageProfiles: false,
        collection: [],
      };
    }
  };

  createProfile: CreateProfile = async (payload) => {
    return await this.apiService.post<ProfilesData>('/v2/accounts/profiles', payload, { withAuthentication: true });
  };

  updateProfile: UpdateProfile = async ({ id, ...params }) => {
    if (!id) {
      throw new Error('Profile id is required.');
    }

    return await this.apiService.put<ProfilesData>(`/v2/accounts/profiles/${id}`, params, { withAuthentication: true });
  };

  enterProfile: EnterProfile = async ({ id, pin }) => {
    try {
      const profile = await this.apiService.post<ProfilesData>(`/v2/accounts/profiles/${id}/token`, { pin }, { withAuthentication: true });

      // this sets the inplayer_token for the InPlayer SDK
      if (profile) {
        const tokenData = JSON.stringify({
          expires: profile.credentials.expires,
          token: profile.credentials.access_token,
          refreshToken: '',
        });

        await this.storageService.setItem('inplayer_token', tokenData, false);
      }

      return profile;
    } catch {
      throw new Error('Unable to enter profile.');
    }
  };

  getProfileDetails: GetProfileDetails = async ({ id }) => {
    try {
      return await this.apiService.get<ProfilesData>(`/v2/accounts/profiles/${id}`, { withAuthentication: true });
    } catch {
      throw new Error('Unable to get profile details.');
    }
  };

  deleteProfile: DeleteProfile = async ({ id }) => {
    try {
      await this.apiService.remove<ProfilesData>(`/v2/accounts/profiles/${id}`, { withAuthentication: true });

      return {
        message: 'Profile deleted successfully',
        code: 200,
      };
    } catch {
      throw new Error('Unable to delete profile.');
    }
  };
}
