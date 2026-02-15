import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@vaanix/shared', '@vaanix/database'],
};

export default nextConfig;
