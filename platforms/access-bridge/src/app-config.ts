import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';

// Load environment variables from .env files
function loadEnvFiles() {
  const env = process.env.NODE_ENV === 'production' ? 'env.prod' : 'env';
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  // Load .env file
  const envPath = path.resolve(__dirname, `../.${env}`);
  dotenv.config({ path: envPath });

  // Load .env.local file if it exists
  const envLocalPath = path.resolve(__dirname, `../.${env}.local`);
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
}

// Ensure environment variables are loaded
loadEnvFiles();

// Function to assert an environment variable is defined
function requireEnvVar(env: string | undefined, name: string): string {
  if (!env) {
    throw new Error(`Environment variable "${name}" is not defined.`);
  }
  return env;
}

// Customer secret resonsible for authenticating requests
export const API_SECRET = requireEnvVar(process.env.API_SECRET, 'API_SECRET');
export const STRIPE_SECRET = requireEnvVar(process.env.STRIPE_SECRET, 'STRIPE_SECRET');

// BIND_ADDR specifies the network address or IP address on which the server listens for incoming connections.
// This could be an IP address (e.g., '127.0.0.1' for localhost) or a hostname.
export const BIND_ADDR = requireEnvVar(process.env.BIND_ADDR, 'BIND_ADDR');

// BIND_PORT specifies the port number on which the server listens for incoming connections.
// Ensure this port is available and not in use by another application.
export const BIND_PORT = parseInt(requireEnvVar(process.env.BIND_PORT, 'BIND_PORT'), 10);

// Client URLs
export const ACCESS_CONTROL_CLIENT = requireEnvVar(process.env.ACCESS_CONTROL_CLIENT, 'ACCESS_CONTROL_CLIENT');
export const SIMS_CLIENT = requireEnvVar(process.env.SIMS_CLIENT, 'SIMS_CLIENT');

// Add MIDDLEWARE_BASE_URL to the environment variables
export const MIDDLEWARE_BASE_URL = requireEnvVar(process.env.MIDDLEWARE_BASE_URL, 'MIDDLEWARE_BASE_URL');
