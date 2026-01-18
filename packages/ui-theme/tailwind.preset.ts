import type { Config } from 'tailwindcss'

const preset: Partial<Config> = {
  theme: {
    extend: {
		colors: {
			"brand": '#d33479',
			"brand-light": '#e65f9a',
			"brand-dark": '#a91f5e',
			"blue": "#3479D3",
			"white": "#fff",
			"dark-gray": "#333",
			"gray": "#777"
		},
		fontFamily: {
			harkana: ['MSB'], // default body font
		},
    },
  },
}

export default preset