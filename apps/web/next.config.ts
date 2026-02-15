import type { NextConfig } from 'next';
import { config } from 'dotenv';

config({ path: '../../.env' });

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
];

for (const name of requiredEnvVars) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ['@vaanix/shared', '@vaanix/database'],
};

export default nextConfig;
