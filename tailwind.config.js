/** @type {import('tailwindcss').Config} */


import { withAccountKitUi, createColorSet } from "@account-kit/react/tailwind";

// wrap your existing tailwind config with 'withAccountKitUi'

const config = {
	darkMode: ["class"],
	mode: 'jit',
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",

		// Or if using `src` directory:
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			screens: {
				'xs': '400px', // Extra small screens
			},
			container: {
				center: true, // Centers the container horizontally
				padding: '1rem', // Adds horizontal padding
				screens: {
					sm: '100%', // Optional: Set the container width for specific breakpoints
					md: '100%',
					lg: '100%',
					xl: '1200px',
					'2xl': '1536px', // Set the max-width for 2xl to 1536px
					'3xl': '1800px', // Set the max-width for 3xl to 1800px
				},
			},
			animation: {
				glow: 'glow 1.5s ease-in-out infinite alternate',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fadeIn': 'fadeIn 0.5s ease-out'
			},
			keyframes: {
				glow: {
					'0%': {
						boxShadow: '0 0 5px rgba(34,211,238,0.5)'
					},
					'100%': {
						boxShadow: '0 0 20px rgba(34,211,238,0.8)'
					}
				},
				'fadeIn': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			colors: {
				'skyBlue': '#2196F3',
				'lightGrey': '#C2C2C2',
				'darkGrey': '#1D212F',
				'navyBlue': "#090E1C",
				'whitish': '#EBEDF5',
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
				'midBlue': '#0755E9',
				"darkSlate": '#99A4A9',
				"btn-primary": createColorSet("#E82594", "#66dfff"),
				"fg-accent-brand": createColorSet("#E82594", "#66dfff"),
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

export default withAccountKitUi(config)