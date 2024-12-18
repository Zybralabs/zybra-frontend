/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",

		// Or if using `src` directory:
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				'lightGrey': '#C2C2C2',
				'darkGrey': '#1D212F',
				'midGreen': '#1ECB44',
				'midRed': '#FF006E',
				'midGrey': '#8A94A6',
				'seaGreen': '#00F8DA',
				'bluishGreen': '#022333',
				'darkGreen': '#022333',
				'midSlate': '#1B3149',
				'darkBlue': '#0C1122',
				'darkGrassGreen': '#001C29',
				'grassGreen': '#059669',
				"midSlate": '#1B3149',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}