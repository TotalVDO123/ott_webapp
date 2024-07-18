declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      API_SECRET: string;
      BIND_ADDR: string;
      BIND_PORT: string;
      ACCESS_CONTROL_CLIENT: string;
      PLANS_CLIENT: string;
      // Add more custom environment variables as needed
    }
  }
}
