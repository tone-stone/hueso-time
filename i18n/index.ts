import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en, es } from '@/i18n/locales';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'es';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: deviceLang === 'en' ? 'en' : 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
