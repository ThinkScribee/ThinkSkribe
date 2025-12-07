/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
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
            50: '#e6f2ff',
            100: '#b3d9ff',
            200: '#80c0ff',
            300: '#4da7ff',
            400: '#1a8eff',
            500: '#017DB0', // Main secondary color
            600: '#0166a0',
            700: '#014f90',
            800: '#013880',
            900: '#015382', // Main primary color
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
            light: 'hsl(var(--primary-light))',
            dark: 'hsl(var(--primary-dark))',
          },
          secondary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#017DB0', // Secondary blue
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            DEFAULT: 'hsl(var(--secondary))',
            foreground: 'hsl(var(--secondary-foreground))',
          },
          destructive: {
            DEFAULT: 'hsl(var(--destructive))',
            foreground: 'hsl(var(--destructive-foreground))',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted))',
            foreground: 'hsl(var(--muted-foreground))',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent))',
            foreground: 'hsl(var(--accent-foreground))',
          },
          success: {
            DEFAULT: 'hsl(var(--success))',
            foreground: 'hsl(var(--success-foreground))',
          },
          popover: {
            DEFAULT: 'hsl(var(--popover))',
            foreground: 'hsl(var(--popover-foreground))',
          },
          card: {
            DEFAULT: 'hsl(var(--card))',
            foreground: 'hsl(var(--card-foreground))',
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
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          abril: ['Abril Fatface', 'serif'],
          heading: ['Abril Fatface', 'serif'],
        },
        boxShadow: {
          'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          'chat': '0 4px 6px -1px rgba(1, 83, 130, 0.1), 0 2px 4px -1px rgba(1, 83, 130, 0.06)',
          'elegant': 'var(--shadow-elegant)',
          'glow': 'var(--shadow-glow)',
          'subtle': 'var(--shadow-subtle)',
        },
        backgroundImage: {
          'gradient-primary': 'var(--gradient-primary)',
          'gradient-hero': 'var(--gradient-hero)',
          'gradient-card': 'var(--gradient-card)',
          'gradient-section': 'var(--gradient-section)',
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
          'xl': '1rem',
          '2xl': '1.5rem',
        },
        animation: {
          'blink': 'blink-caret .75s step-end infinite',
          'accordion-down': 'accordion-down 0.2s ease-out',
          'accordion-up': 'accordion-up 0.2s ease-out',
          'fade-in-up': 'fade-in-up 0.8s ease-out forwards'
        },
        keyframes: {
          'blink-caret': {
            'from, to': { 'border-color': 'transparent' },
            '50%': { 'border-color': 'currentColor' }
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
          },
          'fade-in-up': {
            '0%': {
              opacity: '0',
              transform: 'translateY(30px)'
            },
            '100%': {
              opacity: '1',
              transform: 'translateY(0)'
            }
          }
        },
        // Add height calculation utility
        height: {
          'screen-minus-header': 'calc(100vh - 80px)',
        }
      },
    },
    plugins: [require("tailwindcss-animate")],
  } 