import type { Config } from 'tailwindcss'
// Import the preset directly from the workspace package to avoid resolution/type issues
import preset from '../../packages/ui-theme/tailwind.preset'

const config: Config = {
  presets: [preset as any],
  content: [
    './index.html',
    './src/**/*.{vue,ts,js,jsx,tsx}',
    // scan workspace packages (source and built outputs)
    '../../packages/**/src/**/*.{vue,ts,js,jsx,tsx,html}',
    '../../packages/**/dist/**/*.{vue,ts,js,jsx,tsx,html}',
    // scan other apps in the monorepo if they share components
    '../../apps/**/src/**/*.{vue,ts,js,jsx,tsx,html}',
    // also scan resolved workspace packages under node_modules (pnpm symlinks)
    './node_modules/@harkana/**/src/**/*.{vue,ts,js,jsx,tsx,html}'
  ],
}

export default config