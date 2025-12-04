/** @type {import('next').NextConfig} */

const isGithubPages = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? '/UMBC-VISA-DASHBOARD' : '',
  assetPrefix: isGithubPages ? '/UMBC-VISA-DASHBOARD/' : '',
  trailingSlash: true,
};

export default nextConfig;
