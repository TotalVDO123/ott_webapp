# Access Bridge

A service that facilitates seamless communication between SIMS (Subscriber Identity Management System) and Access Control services. It provides endpoints to generate and refresh access passports for authenticated viewers, ensuring secure and efficient access management.

## Local Setup for Environment Variables

To set up the project locally, you need to configure environment variables that are crucial for authenticating with the JW Delivery Gateway and for specifying server configurations.

Here’s how you can set them up:

Create a `.env.local` file in the root of this project and add the following variables:

- API_SECRET=customer_v1_secret
- BIND_ADDR=localhost
- BIND_PORT=3000
- ACCESS_CONTROL_CLIENT=https://cdn-dev.jwplayer.com
- PLANS_CLIENT=https://daily-sims.jwplayer.com

Make sure to replace the placeholder values (e.g., customer_v1_secret) with the actual values from your JW Dashboard.  
You can also copy and paste the contents of `.env.example` into `.env.local` and just adjust the API_SECRET.

## Getting started

- Run `yarn` to install dependencies
- Navigate to the platform directory `cd platforms/access-bridge`
- Run tests through `yarn test`
- Run `yarn start` to start the server

## Exposed endpoints

#### URL: `/v2/sites/{site_id}/access/generate`

- **Method:** PUT
- **Authorization:** Valid SIMS token
- **Summary:** Generates a new passport for an authenticated viewer based on the information inside the SIMS token.
- **Response:**
  ```json
  {
    "passport": "encrypted_passport",
    "refresh_token": "random_string"
  }
  ```

#### URL: `/v2/sites/{site_id}/access/refresh`

- **Method:** PUT
- **Authorization:** Valid SIMS token
- **Summary:** Regenerates an existing passport with a new expiry and a new refresh token.
- **Request:**
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Response:**
  ```json
  {
    "passport": "encrypted_passport",
    "refresh_token": "random_string"
  }
  ```

## Developer guidelines

- Read the workspace guidelines here [../../docs/developer-guidelines.md](../../docs/developer-guidelines.md).
- Read the web platform guidelines here [./docs/developer-guidelines.md](./docs/developer-guidelines.md).
