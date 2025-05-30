// postcss.config.mjs
    /** @type {import('postcss-load-config').Config} */
    const config = {
      plugins: {
        '@tailwindcss/postcss': {
          // NO content, NO safelist, NO theme, NO plugins here.
          // Let it try to use its absolute defaults.
        },
        'autoprefixer': {},
      },
    };
    export default config;