import { useTranslation as useI18nTranslation } from 'react-i18next';
import { setCookie } from '../utils/cookies';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    // Save to both localStorage and cookie for persistence
    localStorage.setItem('i18nextLng', lang);
    setCookie('i18nextLng', lang, 365); // Save for 1 year
  };

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage: i18n.language,
  };
};
