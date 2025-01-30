'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontMode = 'sans' | 'mono';

interface FontModeContextType {
  fontMode: FontMode;
  toggleFontMode: () => void;
}

const FontModeContext = createContext<FontModeContextType | undefined>(
  undefined
);

export function FontModeProvider({ children }: { children: React.ReactNode }) {
  const [fontMode, setFontMode] = useState<FontMode>('mono');

  useEffect(() => {
    // Get initial font mode from localStorage or default to 'mono'
    const savedFontMode = localStorage.getItem('font-mode') as FontMode;
    if (savedFontMode) {
      setFontMode(savedFontMode);
      document.body.style.fontFamily = `var(--font-geist-${savedFontMode})`;
    }
  }, []);

  const toggleFontMode = () => {
    const newMode = fontMode === 'mono' ? 'sans' : 'mono';
    setFontMode(newMode);
    localStorage.setItem('font-mode', newMode);
    document.body.style.fontFamily = `var(--font-geist-${newMode})`;
  };

  return (
    <FontModeContext.Provider value={{ fontMode, toggleFontMode }}>
      {children}
    </FontModeContext.Provider>
  );
}

export function useFontMode() {
  const context = useContext(FontModeContext);
  if (context === undefined) {
    throw new Error('useFontMode must be used within a FontModeProvider');
  }
  return context;
}
