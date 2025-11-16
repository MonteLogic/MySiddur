const path = require('path');
const webpack = require('webpack');

// Check if Clerk is disabled
const isClerkDisabled = process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';
const hasDisableClerkEnv = process.env.DISABLE_CLERK !== undefined || process.env.NEXT_PUBLIC_DISABLE_CLERK !== undefined;

// Check if we're in a build/production context (not dev)
const isBuildContext = process.env.NODE_ENV === 'production' || process.argv.includes('build') || process.env.CI === 'true';

// Prevent deployment if DISABLE_CLERK is set in production/build
if (isBuildContext && hasDisableClerkEnv) {
  console.error('\n');
  console.error('╔════════════════════════════════════════════════════════════════════════════╗');
  console.error('║                                                                            ║');
  console.error('║                    ❌ DEPLOYMENT BLOCKED ❌                                ║');
  console.error('║                                                                            ║');
  console.error('║  DISABLE_CLERK environment variable is set.                               ║');
  console.error('║  Deployment is blocked to prevent accidentally deploying without auth.     ║');
  console.error('║                                                                            ║');
  console.error('║  To proceed with deployment:                                               ║');
  console.error('║    1. Remove DISABLE_CLERK from your environment variables                 ║');
  console.error('║    2. Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set correctly          ║');
  console.error('║    3. Re-run the build/deployment                                          ║');
  console.error('║                                                                            ║');
  console.error('╚════════════════════════════════════════════════════════════════════════════╝');
  console.error('\n');
  process.exit(1);
}

// Show notice in dev mode only
if (!isBuildContext && isClerkDisabled) {
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