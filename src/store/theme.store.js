import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEMES = [
  { id: 'orange', label: 'Orange',  swatch: '#f97316', description: 'Warm & energetic'  },
  { id: 'blue',   label: 'Blue',    swatch: '#3b82f6', description: 'Clean & trustworthy' },
  { id: 'green',  label: 'Green',   swatch: '#10b981', description: 'Fresh & natural'   },
  { id: 'purple', label: 'Purple',  swatch: '#8b5cf6', description: 'Creative & elegant' },
  { id: 'rose',   label: 'Rose',    swatch: '#f43f5e', description: 'Bold & vibrant'    },
  { id: 'teal',   label: 'Teal',    swatch: '#14b8a6', description: 'Calm & modern'     },
  { id: 'amber',  label: 'Amber',   swatch: '#f59e0b', description: 'Bright & cheerful' },
  { id: 'indigo', label: 'Indigo',  swatch: '#6366f1', description: 'Deep & professional' },
];

function applyTheme(id) {
  // 'orange' is the default — remove data-theme entirely so :root vars apply
  if (!id || id === 'orange') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', id);
  }
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'orange',
      setTheme: (id) => {
        applyTheme(id);
        set({ theme: id });
      },
    }),
    { name: 'restaurant-theme' }
  )
);

// Call once on app startup to restore persisted theme
export function initTheme() {
  const stored = JSON.parse(localStorage.getItem('restaurant-theme') || '{}');
  applyTheme(stored?.state?.theme || 'orange');
}
