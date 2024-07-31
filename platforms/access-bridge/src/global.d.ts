declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_SECRET: string;
      STRIPE_SECRET: string;
      BIND_ADDR: string;
      BIND_PORT: string;
      ACCESS_CONTROL_CLIENT: string;
      SIMS_CLIENT: string;
      // Add more custom environment variables as needed
    }
  }
}
