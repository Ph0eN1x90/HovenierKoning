import { getIndexedDb } from './useIndexedDb';

export type ThemeModePreference = 'dark' | 'light' | 'auto';

const THEME_MODE_KEY = 'themeMode';

async function setThemeModePreference(mode: ThemeModePreference): Promise<void> {
  const db = await getIndexedDb();
  await db.put('uiPreferences', mode, THEME_MODE_KEY);
}

async function getThemeModePreference(): Promise<ThemeModePreference | null> {
  const db = await getIndexedDb();
  const value = await db.get('uiPreferences', THEME_MODE_KEY);

  if (value === 'dark' || value === 'light' || value === 'auto') {
    return value;
  }

  return null;
}

export function useUiPreferences() {
  return {
    setThemeModePreference,
    getThemeModePreference,
  };
}
