const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compresión y optimización de paquetes
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Permitir la IP de tu red local en desarrollo (para probar la web en tu celular sin bloqueos de origen)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.102',
  ],

  // 1. Optimización de Imágenes Vercel (Formatos WebP y AVIF comprimidos)
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // 2. Cabeceras HTTP de Seguridad (Pentesting & Hardening Estándar de la Industria)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Previene ataques de Clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Bloquea sniffing de tipos MIME
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Protección contra Cross-Site Scripting
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload', // HSTS 2 años con precarga oficial
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },

  // 3. Redirecciones automáticas (alias singular /producto -> plural /productos para prevenir 404s)
  async redirects() {
    return [
      {
        source: '/producto',
        destination: '/productos',
        permanent: true,
      },
      {
        source: '/producto/:slug*',
        destination: '/productos/:slug*',
        permanent: true,
      },
      {
        source: '/:locale(es|en)/producto',
        destination: '/:locale/productos',
        permanent: true,
      },
      {
        source: '/:locale(es|en)/producto/:slug*',
        destination: '/:locale/productos/:slug*',
        permanent: true,
      },
      {
        source: '/productos/adicionales',
        destination: '/productos?cat=adicionales',
        permanent: true,
      },
      {
        source: '/:locale(es|en)/productos/adicionales',
        destination: '/:locale/productos?cat=adicionales',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "alonsoriosdev",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
