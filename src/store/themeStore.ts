import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightPalette, DarkPalette, type PaletteType } from '@/constants/theme';

type ColorScheme = 'light' | 'dark';

type ThemeState = {
  colorScheme: ColorScheme;
  palette: PaletteType;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  loadPersistedTheme: () => Promise<void>;
};

const THEME_KEY = '@benefitos_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  palette: LightPalette,

  toggleTheme: () => {
    const next: ColorScheme = get().colorScheme === 'light' ? 'dark' : 'light';
    set({ colorScheme: next, palette: next === 'light' ? LightPalette : DarkPalette });
    AsyncStorage.setItem(THEME_KEY, next);
  },

  setColorScheme: (scheme) => {
    set({ colorScheme: scheme, palette: scheme === 'light' ? LightPalette : DarkPalette });
    AsyncStorage.setItem(THEME_KEY, scheme);
  },

  loadPersistedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        set({ colorScheme: saved, palette: saved === 'light' ? LightPalette : DarkPalette });
      }
    } catch {
      // silently fall back to light
    }
  },
}));

/** Convenience hook — returns the active palette for the current theme */
export function usePalette(): PaletteType {
  return useThemeStore((s) => s.palette);
}
