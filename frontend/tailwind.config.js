/** @type {import('tailwindcss').Config} */
module.exports = {
    blocklist: ["overline"],
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            borderRadius: {
                lg: '10px',
                md: '7px',
                sm: '7px'
            },
            colors: {
                background: 'var(--c-background)',
                foreground: 'var(--c-cream)',
                surface: {
                    DEFAULT: 'var(--c-surface)',
                    2: 'var(--c-surface2)',
                    3: 'var(--c-surface3)'
                },
                gold: {
                    DEFAULT: 'var(--c-gold)',
                    hover: 'var(--c-gold-hover)',
                    text: 'var(--c-gold-text)'
                },
                cream: 'var(--c-cream)',
                body: 'var(--c-body)',
                dim: 'var(--c-dim)',
                ink: 'var(--c-ink)',
                green: 'var(--c-green)',
                blue: 'var(--c-blue)',
                danger: 'var(--c-danger-text)',
                card: {
                    DEFAULT: 'var(--c-surface)',
                    foreground: 'var(--c-cream)'
                },
                popover: {
                    DEFAULT: 'var(--c-surface2)',
                    foreground: 'var(--c-cream)'
                },
                primary: {
                    DEFAULT: 'var(--c-gold)',
                    foreground: 'var(--c-ink)'
                },
                secondary: {
                    DEFAULT: 'var(--c-surface2)',
                    foreground: 'var(--c-cream)'
                },
                muted: {
                    DEFAULT: 'var(--c-surface2)',
                    foreground: 'var(--c-muted)'
                },
                accent: {
                    DEFAULT: 'var(--c-surface3)',
                    foreground: 'var(--c-cream)'
                },
                destructive: {
                    DEFAULT: 'var(--c-danger-text)',
                    foreground: 'var(--c-cream)'
                },
                border: 'var(--c-border)',
                input: 'var(--c-border-strong)',
                ring: 'var(--c-focus)'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
