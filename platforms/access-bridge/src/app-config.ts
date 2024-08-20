// Function to assert an environment variable is defined
function requireEnvVar(env: string | undefined, name: string): string {
  if (!env) {
    throw new Error(`Environment variable "${name}" is not defined.`);
  }
  return env;
}

// BIND_ADDR specifies the network address or IP address on which the server listens for incoming connections.
// This could be an IP address (e.g., '127.0.0.1' for localhost) or a hostname.
export const BIND_ADDR = requireEnvVar(process.env.APP_BIND_ADDR, 'APP_BIND_ADDR');

// BIND_PORT specifies the port number on which the server listens for incoming connections.
// Ensure this port is available and not in use by another application.
export const BIND_PORT = parseInt(requireEnvVar(process.env.APP_BIND_PORT, 'APP_BIND_PORT'), 10);

// Customer secret resonsible for authenticating requests
export const API_SECRET = requireEnvVar(process.env.APP_API_SECRET, 'APP_API_SECRET');

// Client URLs
export const ACCESS_CONTROL_CLIENT = requireEnvVar(process.env.APP_ACCESS_CONTROL_HOST, 'APP_ACCESS_CONTROL_HOST');
export const SIMS_CLIENT = requireEnvVar(process.env.APP_SIMS_HOST, 'SIMS_HOST');
