import type { Config } from 'tailwindcss'
// Import the preset directly from the workspace package to avoid resolution/type issues
import preset from '../../packages/ui-theme/tailwind.preset'

const config: Config = {
  presets: [preset as any],
  content: [
    './index.html',
    './src/**/*.{vue,ts,js,jsx,tsx}',
    '../../packages/ui-core/src/**/*.{vue,ts,js,jsx,tsx,html}',
    '../../packages/ui-loading/*.{vue,ts,js,jsx,tsx,html}',
  ],
}

export default config
