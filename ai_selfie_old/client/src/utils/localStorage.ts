/**
 * Safe localStorage utilities that handle errors gracefully
 * This prevents crashes in private browsing mode, when localStorage is full,
 * or when localStorage is disabled by the browser
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('[localStorage] Could not read key:', key, e);
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('[localStorage] Could not write key:', key, e);
    }
    return false;
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn('[localStorage] Could not remove key:', key, e);
    }
    return false;
  },

  /**
   * Get an item and parse it as JSON
   * Returns null if the item doesn't exist or can't be parsed
   */
  getJSON: <T>(key: string): T | null => {
    const value = safeLocalStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn('[localStorage] Could not parse JSON for key:', key, e);
      return null;
    }
  },

  /**
   * Set an item as JSON
   */
  setJSON: (key: string, value: unknown): boolean => {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[localStorage] Could not stringify value for key:', key, e);
      return false;
    }
  },

  /**
   * Clear all items (use with caution)
   */
  clear: (): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        return true;
      }
    } catch (e) {
      console.warn('[localStorage] Could not clear storage:', e);
    }
    return false;
  },
};

export default safeLocalStorage;

