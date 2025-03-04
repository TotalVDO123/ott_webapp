import { array, boolean, mixed, number, object, type SchemaOf, string, StringSchema } from 'yup';

import type { Cleeng, Config, Content, Features, JWP, Menu, Styling } from '../../types/config';

const contentSchema: SchemaOf<Content> = object({
  contentId: string().notRequired(),
  title: string().notRequired(),
  featured: boolean().notRequired(),
  backgroundColor: string().nullable().notRequired(),
  type: mixed().oneOf(['playlist', 'continue_watching', 'favorites', 'content_list']),
  custom: object().notRequired(),
}).defined();

const menuSchema: SchemaOf<Menu> = object().shape({
  label: string().defined(),
  contentId: string().defined(),
  filterTags: string().notRequired(),
  type: mixed().oneOf(['playlist', 'content_list', 'media']).notRequired(),
  custom: object().notRequired(),
});

const featuresSchema: SchemaOf<Features> = object({
  recommendationsPlaylist: string().nullable(),
  searchPlaylist: string().nullable(),
  continueWatchingList: string().nullable(),
  favoritesList: string().nullable(),
});

const cleengSchema: SchemaOf<Cleeng> = object({
  id: string().nullable(),
  monthlyOffer: string().nullable(),
  yearlyOffer: string().nullable(),
  useSandbox: boolean().default(true),
});

const jwpSchema: SchemaOf<JWP> = object({
  clientId: string().nullable(),
  assetId: number().nullable(),
  useSandbox: boolean().default(true),
});

const stylingSchema: SchemaOf<Styling> = object({
  backgroundColor: string().nullable(),
  highlightColor: string().nullable(),
  headerBackground: string().nullable(),
  footerText: string().nullable(),
});

export const configSchema: SchemaOf<Config> = object({
  id: string().notRequired(),
  siteName: string().notRequired(),
  description: string().defined(),
  analyticsToken: string().nullable(),
  adSchedule: string().nullable(),
  adDeliveryMethod: mixed().oneOf(['csai', 'ssai']).notRequired(),
  adConfig: string().nullable(),
  siteId: string().defined(),
  assets: object({
    banner: string().notRequired().nullable(),
  }).notRequired(),
  content: array().of(contentSchema),
  menu: array().of(menuSchema),
  styling: stylingSchema.notRequired(),
  features: featuresSchema.notRequired(),
  integrations: object({
    cleeng: cleengSchema.notRequired(),
    jwp: jwpSchema.notRequired(),
  }).notRequired(),
  adScheduleUrls: object({
    json: string().notRequired().nullable(),
    xml: string().notRequired().nullable(),
  }).notRequired(),
  custom: object().notRequired(),
  contentSigningService: object().shape({
    // see {@link https://github.com/jquense/yup/issues/1367}
    host: string().required() as StringSchema<string>,
    drmPolicyId: string().notRequired(),
  }),
  contentProtection: object()
    .shape({
      accessModel: string().oneOf(['free', 'freeauth', 'authvod', 'svod']).notRequired(),
      drm: object({
        defaultPolicyId: string(),
      }).notRequired(),
    })
    .notRequired(),
}).defined();
