const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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