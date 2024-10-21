import GitVersionListPlugin from "./plugins/webpack.plugin.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new GitVersionListPlugin({
        minVersion: "v0.3.0",
        outputPath: "./src/lib/gitVersions.ts",
      }),
    );
    return config;
  },
};

export default nextConfig;
