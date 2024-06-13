import { injectable } from 'inversify';

import { getNamedModule } from '../modules/container';
import ContentService from '../services/content/ContentService';
import type { ListType } from '../../types/config';
import type { GetContentListParams, GetContentSearchParams } from '../../types/playlist';
import { useConfigStore } from '../stores/ConfigStore';

@injectable()
export default class ContentController {
  getContentList = async (id: string | undefined, type: ListType, params: GetContentListParams) => {
    const { config } = useConfigStore.getState();

    const contentService = this.getContentService(type);

    const list = await contentService?.getContentList({ id, siteId: config.siteId, params });

    return list;
  };

  getContentSearch = async (id: string | undefined, type: ListType, params: GetContentSearchParams) => {
    const { config } = useConfigStore.getState();

    const contentService = this.getContentService(type);

    const list = await contentService?.getContentSearch({ id, siteId: config.siteId, params });

    return list;
  };

  private getContentService = (type: ListType) => {
    const service = getNamedModule(ContentService, type, false);

    if (!service) {
      console.error(`No service was added for the ${type} list type`);
    }

    return service;
  };
}
