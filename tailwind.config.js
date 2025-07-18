module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue Palette
        primary: {
          50: '#EFF6FF', // Very light blue background
          100: '#DBEAFE', // Light blue for cards
          200: '#BFDBFE', // Soft blue for borders
          300: '#93C5FD', // Medium blue for inactive states
          400: '#60A5FA', // Bright blue for highlights
          500: '#3B82F6', // Main brand blue
          600: '#2563EB', // Darker blue for buttons
          700: '#1D4ED8', // Deep blue for active states
          800: '#1E40AF', // Very dark blue
          900: '#1E3A8A', // Darkest blue
        },

        // Secondary Blue Palette (Lighter tones)
        secondary: {
          50: '#F0F9FF', // Ice blue
          100: '#E0F2FE', // Sky blue
          200: '#BAE6FD', // Light sky blue
          300: '#7DD3FC', // Medium sky blue
          400: '#38BDF8', // Bright sky blue
          500: '#0EA5E9', // Main secondary blue
          600: '#0284C7', // Darker sky blue
          700: '#0369A1', // Deep sky blue
          800: '#075985', // Very dark sky blue
          900: '#0C4A6E', // Darkest sky blue
        },

        // Gray Palette (for text and backgrounds)
        gray: {
          50: '#F9FAFB', // Almost white
          100: '#F3F4F6', // Very light gray
          200: '#E5E7EB', // Light gray
          300: '#D1D5DB', // Medium light gray
          400: '#9CA3AF', // Medium gray
          500: '#6B7280', // Dark gray for text
          600: '#4B5563', // Darker gray
          700: '#374151', // Very dark gray
          800: '#1F2937', // Almost black
          900: '#111827', // Black
        },

        // Success Colors (for income/positive amounts)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },

        // Warning Colors (for alerts/notifications)
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },

        // Error Colors (for expenses/negative amounts)
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },

        // Custom App Colors
        app: {
          background: '#FFFFFF', // Pure white background
          surface: '#F8FAFC', // Light surface color
          border: '#E2E8F0', // Light border color
          text: '#1E293B', // Dark text
          textSecondary: '#64748B', // Secondary text
          accent: '#3B82F6', // Accent color (same as primary-500)
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },

      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '1'],
      },

      spacing: {
        18: '4.5rem', // 72px
        88: '22rem', // 352px
        128: '32rem', // 512px
      },

      borderRadius: {
        '4xl': '2rem', // 32px
        '5xl': '2.5rem', // 40px
      },

      boxShadow: {
        soft: '0 2px 8px 0 rgba(59, 130, 246, 0.1)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        floating:
          '0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
      },
    },
  },
  plugins: [],
};
