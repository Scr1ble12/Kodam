import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Catamaran_400Regular,
  Catamaran_600SemiBold,
  Catamaran_700Bold,
} from '@expo-google-fonts/catamaran';
import { MuktaMalar_400Regular, MuktaMalar_500Medium, MuktaMalar_700Bold } from '@expo-google-fonts/mukta-malar';
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_700Bold,
} from '@expo-google-fonts/noto-sans-tamil';
import { useFonts } from 'expo-font';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeName = 'light' | 'paper' | 'dark';
export type FontName = 'mukta' | 'noto' | 'catamaran';
export type LetterSize = 's' | 'm' | 'l';
export type RomanMode = 'on' | 'fade' | 'off';
export type SpokenMode = 'both' | 'written';

export type Settings = {
  theme: ThemeName;
  accent: string;
  font: FontName;
  size: LetterSize;
  roman: RomanMode;
  /** Show the spoken form of a word next to the written one. */
  spoken: SpokenMode;
  /** New vocabulary words introduced per day in the daily review. */
  newWords: number;
};

const DEFAULTS: Settings = { theme: 'light', accent: '#0E6B63', font: 'mukta', size: 'm', roman: 'fade', spoken: 'both', newWords: 10 };
const STORAGE_KEY = 'tamil-app/settings/v1';

export const ACCENTS = [
  { name: 'Teal', hex: '#0E6B63' },
  { name: 'Indigo', hex: '#2F4BB5' },
  { name: 'Terracotta', hex: '#B4532A' },
  { name: 'Plum', hex: '#7A3E8E' },
  { name: 'Ink', hex: '#15171A' },
];

const PALETTES = {
  light: { bg: '#F5F6F4', surface: '#FFFFFF', ink: '#15171A', muted: '#5E646B', line: '#E3E5E2', track: '#E9EBE8' },
  paper: { bg: '#F4F1EA', surface: '#FBF9F4', ink: '#1E1B16', muted: '#615A50', line: '#E2DCCF', track: '#EAE5DA' },
  dark: { bg: '#111315', surface: '#1B1E21', ink: '#ECEEF0', muted: '#A3A9AF', line: '#2B2F33', track: '#24282C' },
};

const FAMILIES: Record<FontName, { regular: string; medium: string; bold: string }> = {
  mukta: { regular: 'MuktaMalar_400Regular', medium: 'MuktaMalar_500Medium', bold: 'MuktaMalar_700Bold' },
  noto: { regular: 'NotoSansTamil_400Regular', medium: 'NotoSansTamil_500Medium', bold: 'NotoSansTamil_700Bold' },
  catamaran: { regular: 'Catamaran_400Regular', medium: 'Catamaran_600SemiBold', bold: 'Catamaran_700Bold' },
};

/** Grid-cell letter size for each Letter size setting; other sizes scale from it. */
const LETTER_PX: Record<LetterSize, number> = { s: 26, m: 30, l: 36 };

function buildTheme(s: Settings) {
  const c = PALETTES[s.theme];
  // The Ink accent would vanish on the dark theme, so it flips to light ink there.
  const inkOnDark = s.theme === 'dark' && s.accent === '#15171A';
  return {
    settings: s,
    dark: s.theme === 'dark',
    colors: {
      ...c,
      accent: inkOnDark ? c.ink : s.accent,
      onAccent: inkOnDark ? c.bg : '#FFFFFF',
      streakInk: s.theme === 'dark' ? '#F3B497' : '#8F3F1E',
      streakBg: s.theme === 'dark' ? '#3A2219' : '#FBEDE6',
      error: s.theme === 'dark' ? '#F59A8F' : '#B42318',
      errorInk: s.theme === 'dark' ? '#F8C9C2' : '#8A1C12',
      errorBg: s.theme === 'dark' ? '#3B1C19' : '#FDECEA',
      onError: s.theme === 'dark' ? '#2A0E0B' : '#FFFFFF',
      success: s.theme === 'dark' ? '#2F9E5A' : '#15803D',
      successInk: s.theme === 'dark' ? '#BDEBCB' : '#14532D',
      successBg: s.theme === 'dark' ? '#163222' : '#E3F4E8',
      scrim: 'rgba(21,23,26,0.45)',
    },
    fonts: FAMILIES[s.font],
    letterPx: LETTER_PX[s.size],
  };
}

export type Theme = ReturnType<typeof buildTheme>;

type ThemeContextValue = Theme & { update: (patch: Partial<Settings>) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    MuktaMalar_400Regular,
    MuktaMalar_500Medium,
    MuktaMalar_700Bold,
    NotoSansTamil_400Regular,
    NotoSansTamil_500Medium,
    NotoSansTamil_700Bold,
    Catamaran_400Regular,
    Catamaran_600SemiBold,
    Catamaran_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setSettings({ ...DEFAULTS, ...JSON.parse(json) });
      })
      .catch(() => {})
      .finally(() => {
        loadedRef.current = true;
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(settings), update: (patch) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  );

  // Hold the first frame until fonts and saved settings are in, so nothing flashes.
  if (!loaded || (!fontsLoaded && !fontError)) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
