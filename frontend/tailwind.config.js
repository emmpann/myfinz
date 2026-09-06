/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                abyss: '#0A131B',
                depth: '#101E2A',
                surface: {
                    DEFAULT: '#16283A',
                    hover: '#1C3247',
                },
                foam: '#F6F8F9',
                mist: {
                    DEFAULT: '#93A8B5',
                    dim: '#6C818D',
                },
                current: {
                    DEFAULT: '#2C86B0',
                    bright: '#4AA6D1',
                    dim: 'rgba(44, 134, 176, 0.14)',
                },
                bio: '#18B8A3',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            borderRadius: {
                'custom': '18px',
            }
        },
    },
    plugins: [],
}