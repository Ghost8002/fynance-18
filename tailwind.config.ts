
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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
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
