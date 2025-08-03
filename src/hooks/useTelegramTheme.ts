
import { useEffect, useState } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export const useTelegramTheme = () => {
  const { webApp, isTelegramWebApp, colorScheme } = useTelegramWebApp();
  const [themeColors, setThemeColors] = useState({
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#1e40af',
    button_color: '#1e40af',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f1f3f4',
    header_bg_color: '#ffffff',
    accent_text_color: '#1e40af',
    section_bg_color: '#ffffff',
    section_header_text_color: '#6d7175',
    subtitle_text_color: '#999999',
    destructive_text_color: '#ec3942',
  });

  useEffect(() => {
    if (!isTelegramWebApp || !webApp?.themeParams) return;

    const isDark = colorScheme === 'dark';
    const params = webApp.themeParams;

    setThemeColors({
      bg_color: params.bg_color || (isDark ? '#1a1a1a' : '#ffffff'),
      text_color: params.text_color || (isDark ? '#ffffff' : '#000000'),
      hint_color: params.hint_color || (isDark ? '#707579' : '#999999'),
      link_color: params.link_color || (isDark ? '#6ab7ff' : '#1e40af'),
      button_color: params.button_color || (isDark ? '#5288c1' : '#1e40af'),
      button_text_color: params.button_text_color || '#ffffff',
      secondary_bg_color: params.secondary_bg_color || (isDark ? '#131415' : '#f1f3f4'),
      header_bg_color: params.header_bg_color || (isDark ? '#1a1a1a' : '#ffffff'),
      accent_text_color: params.accent_text_color || (isDark ? '#6ab7ff' : '#1e40af'),
      section_bg_color: params.section_bg_color || (isDark ? '#1a1a1a' : '#ffffff'),
      section_header_text_color: params.section_header_text_color || '#6d7175',
      subtitle_text_color: params.subtitle_text_color || (isDark ? '#707579' : '#999999'),
      destructive_text_color: params.destructive_text_color || (isDark ? '#ff595a' : '#ec3942'),
    });

    // Устанавливаем CSS переменные
    const root = document.documentElement;
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--tg-theme-${key.replace('_', '-')}`, value);
    });

  }, [webApp, isTelegramWebApp, colorScheme]);

  return {
    themeColors,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
    isTelegramTheme: isTelegramWebApp,
  };
};
