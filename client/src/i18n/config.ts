import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import en from './locales/en.json';
import it from './locales/it.json';
import { getCookie, setCookie } from '../utils/cookies';

// Safe localStorage helper to prevent crashes in private browsing or when localStorage is disabled
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('[i18n] Could not read from localStorage:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('[i18n] Could not write to localStorage:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[i18n] Could not remove from localStorage:', e);
    }
  }
};

// Função para detectar idioma por IP
const detectLanguageFromIP = async (): Promise<string> => {
  try {
    // Usar API sem CORS: ipapi.co com jsonp ou alternativa
    const response = await fetch('https://freeipapi.com/api/json');
    const data = await response.json();
    
    // Mapear código do país para idioma
    const countryToLanguage: Record<string, string> = {
      'BR': 'pt-BR',
      'PT': 'pt-BR',
      'ES': 'es',
      'MX': 'es',
      'AR': 'es',
      'CO': 'es',
      'CL': 'es',
      'PE': 'es',
      'VE': 'es',
      'EC': 'es',
      'GT': 'es',
      'CU': 'es',
      'BO': 'es',
      'DO': 'es',
      'HN': 'es',
      'PY': 'es',
      'SV': 'es',
      'NI': 'es',
      'CR': 'es',
      'PA': 'es',
      'UY': 'es',
      'IT': 'it',
      'SM': 'it',
      'VA': 'it',
      'CH': 'it',
    };
    
    return countryToLanguage[data.countryCode] || 'it';
  } catch (error) {
    console.error('Error detecting language from IP:', error);
    // Fallback: usar idioma do navegador
    const browserLang = (typeof navigator !== 'undefined' ? navigator.language : null) || 'it';
    if (browserLang.startsWith('it')) return 'it';
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('pt')) return 'pt-BR';
    return 'it';
  }
};

const languageDetector = new LanguageDetector();

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'es': { translation: es },
      'en': { translation: en },
      'it': { translation: it },
    },
    lng: (() => {
      // Try to get language from cookie first, then localStorage, then default
      if (typeof window !== 'undefined') {
        const cookieLang = getCookie('i18nextLng');
        if (cookieLang) return cookieLang;
        const storageLang = safeLocalStorage.getItem('i18nextLng');
        if (storageLang) return storageLang;
      }
      return 'it';
    })(),
    fallbackLng: ['it', 'en', 'es', 'pt-BR'],
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'i18nextLng',
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Detectar idioma por IP após inicialização (apenas se não houver preferência salva)
if (typeof window !== 'undefined') {
  const currentLang = getCookie('i18nextLng') || safeLocalStorage.getItem('i18nextLng');
  
  // Sync cookie with localStorage if cookie exists but localStorage doesn't
  const cookieLang = getCookie('i18nextLng');
  if (cookieLang && !safeLocalStorage.getItem('i18nextLng')) {
    safeLocalStorage.setItem('i18nextLng', cookieLang);
  }
  
  // Sync localStorage to cookie if localStorage exists but cookie doesn't
  const storageLang = safeLocalStorage.getItem('i18nextLng');
  if (storageLang && !getCookie('i18nextLng')) {
    setCookie('i18nextLng', storageLang, 365);
  }
  
  if (!currentLang) {
    detectLanguageFromIP().then(detectedLang => {
      i18n.changeLanguage(detectedLang);
      // Save to cookie when auto-detected
      setCookie('i18nextLng', detectedLang, 365);
    }).catch(() => {
      // Se falhar, usar idioma do navegador
      const browserLang = (typeof navigator !== 'undefined' ? navigator.language : null) || 'it';
      let detectedLang = 'it';
      if (browserLang.startsWith('it')) detectedLang = 'it';
      else if (browserLang.startsWith('en')) detectedLang = 'en';
      else if (browserLang.startsWith('es')) detectedLang = 'es';
      else if (browserLang.startsWith('pt')) detectedLang = 'pt-BR';
      
      i18n.changeLanguage(detectedLang);
      // Save to cookie when auto-detected
      setCookie('i18nextLng', detectedLang, 365);
    });
  }
  
  // Listen for language changes and sync to cookie
  i18n.on('languageChanged', (lng) => {
    setCookie('i18nextLng', lng, 365);
    safeLocalStorage.setItem('i18nextLng', lng);
  });
}

export default i18n;
