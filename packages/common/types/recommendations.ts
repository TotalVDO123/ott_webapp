import type { CustomParams } from './custom-params';

export type RecommendationsItem = {
  media_id: string;
  title: string;
  description: string | null;
  tags: string[];
  duration: number;
  custom_params: CustomParams;
};

export type RecommendationsList = {
  id: string;
  title: string;
  description: string | undefined;
  list: RecommendationsItem[];
};
