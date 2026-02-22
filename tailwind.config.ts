import type { Config } from 'tailwindcss';
import uxPreset from './src/styles/tailwind-preset-ux';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [uxPreset],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
