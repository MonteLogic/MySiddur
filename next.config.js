const path = require('path');
const webpack = require('webpack');

// Check if Clerk is disabled and show notice
const isClerkDisabled = process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';

if (isClerkDisabled) {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║                        ⚠️  CLERK IS DISABLED  ⚠️                          ║');
  console.log('║                                                                            ║');
  console.log('║  Clerk authentication has been disabled via environment variable.         ║');
  console.log('║  All routes will be accessible without authentication.                     ║');
  console.log('║                                                                            ║');
  console.log('║  To re-enable Clerk:                                                       ║');
  console.log('║    1. Remove DISABLE_CLERK=true from your .env.local file                 ║');
  console.log('║    2. Restart the dev server                                               ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    (config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '#': path.resolve(__dirname),
      },
    }),
      // Ignore LICENSE files
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /LICENSE$/,
        }),
      );

    // Mark .node files as external
    config.externals.push(({ context, request }, callback) => {
      if (/\.node$/.test(request)) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    });

    // Handle .md files
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'html-loader',
        },
        {
          loader: 'markdown-loader',
        },
      ],
    });

    // Exclude .d.ts files
    config.module.rules.push({
      test: /\.d\.ts$/,
      loader: 'ignore-loader',
    });


    return config;
  },
};

module.exports = nextConfig;