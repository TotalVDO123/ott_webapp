import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@jwp/ott-common/src/stores/ConfigStore';
import { useMemo } from 'react';

import env from '../../common/src/env';

const useSelectedLanguage = (): string => {
  const { i18n } = useTranslation('menu');
  const supportedLanguages = useConfigStore((state) => state.supportedLanguages);

  const currentLanguage = useMemo(() => supportedLanguages.find(({ code }) => code === i18n.language), [i18n.language, supportedLanguages]);

  return currentLanguage?.code || env.APP_DEFAULT_LANGUAGE;
};

export default useSelectedLanguage;
