import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import en from './locales/en.json';
import it from './locales/it.json';

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
    const browserLang = navigator.language || 'it';
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
    lng: 'it', // Set Italian as default language
    fallbackLng: ['it', 'en', 'es', 'pt-BR'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Detectar idioma por IP após inicialização (apenas se não houver preferência salva)
if (typeof window !== 'undefined') {
  const currentLang = localStorage.getItem('i18nextLng');
  if (!currentLang) {
    detectLanguageFromIP().then(detectedLang => {
      i18n.changeLanguage(detectedLang);
    }).catch(() => {
      // Se falhar, usar idioma do navegador
      const browserLang = navigator.language || 'it';
      if (browserLang.startsWith('it')) i18n.changeLanguage('it');
      else if (browserLang.startsWith('en')) i18n.changeLanguage('en');
      else if (browserLang.startsWith('es')) i18n.changeLanguage('es');
      else if (browserLang.startsWith('pt')) i18n.changeLanguage('pt-BR');
      else i18n.changeLanguage('it');
    });
  }
}

export default i18n;
