# Developer guidelines

## When working on this project, keep these in mind:

- Use `yarn` to install dependencies
- Run tests through `yarn test`
- Start the project using `yarn start`

## Project Structure

```
/build*                 - Directory where the code is compiled by `yarn build`
/docs                   - Documentation related to the project
/node_modules*          - Yarn generated dependencies
/src                    - Source code for the application
  /controllers          - Controller modules containing the core logic for handling requests and responses
  /services             - Services which connect external data sources to the application
  /pipeline             - Middleware and routing logic
    /middleware.ts      - Middleware functions and error handling
    /routes.ts          - Route definitions and route registration
  /errors.ts            - Custom error classes and error handling logic
  /http.ts              - HTTP utility functions and setup
  /app-config.ts        - Configuration settings for the application
  /main.ts              - Main entry point of the application
  /server.ts            - Server initialization and configuration
/test                   - Data and scripts for testing
/.env<.mode>            - Environment variables for different modes (e.g., development, production)
/package.json           - Yarn file for dependencies and scripts




* = Generated directories, not in source control

Note: Some system and util files are not shown above for brevity.
You probably won't need to mess with anything not shown here.
```
