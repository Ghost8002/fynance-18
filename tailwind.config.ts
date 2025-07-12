
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: '#e2e8f0',
				input: '#e2e8f0',
				ring: '#24719c',
				background: '#ffffff',
				foreground: '#1f2937',
				primary: {
					DEFAULT: '#24719c',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#f8fafc',
					foreground: '#1f2937'
				},
				destructive: {
					DEFAULT: '#ef4444',
					foreground: '#ffffff'
				},
				muted: {
					DEFAULT: '#f1f5f9',
					foreground: '#6b7280'
				},
				accent: {
					DEFAULT: '#f1f5f9',
					foreground: '#1f2937'
				},
				popover: {
					DEFAULT: '#ffffff',
					foreground: '#1f2937'
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#1f2937'
				},
				sidebar: {
					DEFAULT: '#ffffff',
					foreground: '#1f2937',
					primary: '#24719c',
					'primary-foreground': '#ffffff',
					accent: '#f1f5f9',
					'accent-foreground': '#1f2937',
					border: '#e2e8f0',
					ring: '#24719c'
				},
				finance: {
					primary: '#24719c',
					secondary: '#1a5a7a',
					background: '#ffffff',
					'background-secondary': '#f8fafc',
					'background-alt': '#f1f5f9',
					'text-primary': '#1f2937',
					'text-secondary': '#6b7280',
					'text-tertiary': '#9ca3af',
					red: '#ef4444',
					'red-dark': '#dc2626',
					green: '#10b981',
					blue: '#24719c',
					yellow: '#f59e0b',
					purple: '#8b5cf6',
					gray: '#6b7280',
					"light-gray": '#f1f5f9',
				}
			},
			fontFamily: {
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'geist': ['Geist', 'system-ui', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
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
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'marquee': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'marquee': 'marquee 25s linear infinite'
			},
			backdropBlur: {
				'lg': '16px'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: any) {
			addUtilities({
				'.glass': {
					'background': 'rgba(255, 255, 255, 0.8)',
					'backdrop-filter': 'blur(16px)',
					'-webkit-backdrop-filter': 'blur(16px)',
					'border': '1px solid rgba(255, 255, 255, 0.2)',
				},
				'.glass-hover': {
					'transition': 'all 0.3s ease',
					'&:hover': {
						'background': 'rgba(255, 255, 255, 0.9)',
						'transform': 'translateY(-2px)',
						'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
					}
				},
				'.button-gradient': {
					'background': 'linear-gradient(135deg, #24719c 0%, #1a5a7a 100%)',
					'transition': 'all 0.3s ease',
					'&:hover': {
						'opacity': '0.9',
						'transform': 'translateY(-1px)',
					}
				},
				'.text-gradient': {
					'background': 'linear-gradient(135deg, #24719c 0%, #1a5a7a 100%)',
					'-webkit-background-clip': 'text',
					'background-clip': 'text',
					'-webkit-text-fill-color': 'transparent',
				}
			})
		}
	],
} satisfies Config;
