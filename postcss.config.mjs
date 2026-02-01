// Skip PostCSS plugins during Vitest runs to avoid Tailwind v4 plugin conflicts
const config = {
  plugins: process.env.VITEST ? [] : ['@tailwindcss/postcss'],
}

export default config
