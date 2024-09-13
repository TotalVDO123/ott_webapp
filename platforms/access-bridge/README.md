# Access Bridge

A service that facilitates seamless communication between the Subscriber Identity Management System (SIMS) and Access Control services. It provides endpoints to generate access passports for authenticated viewers, ensuring secure and efficient access management.

## Local Setup for Environment Variables

To set up the project locally, you need to configure environment variables that are crucial for authenticating with the JW Delivery Gateway and for specifying server configurations.

Here’s how you can set them up:

Create a `.env.local` file in the root of this project and add the following variables:

- APP_API_SECRET=customer_v1_secret
- APP_BIND_ADDR=localhost
- APP_BIND_PORT=3000
- APP_ACCESS_CONTROL_API_HOST=https://cdn-dev.jwplayer.com  
  <em>(Use https://cdn.jwplayer.com for production)</em>
- APP_SIMS_API_HOST=https://daily-sims.jwplayer.com  
  <em>(Use https://sims.jwplayer.com for production)</em>

Make sure to replace the placeholder values (e.g., customer_v1_secret) with the actual values from your JW Dashboard.  
You can also copy and paste the contents of `.env.example` into `.env.local` and just adjust the APP_API_SECRET.

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

#### URL: `/v2/sites/{site_id}/products`

- **Method:** GET
- **Authorization:** None
- **Summary:** Lists all the corresponding stripe products with prices that are connected to the SIMS plans.
- **Response:** [Product payment type](../../../ott-web-app/packages/common/types/payment.ts)
  ```json
  [
    {
      // ...
      "id": "prod_QRUHbH7wK5HHPr",
      "default_price": "price_1PabInA9TD3ZjIM6EEnKSR7U",
      // ...
      "prices": [
        {
          // ...
          "id": "price_1PabInA9TD3ZjIM6EEnKSR7U",
          "currency": "usd",
          "unit_amount": 15000
          // ...
        }
      ]
    }
    // ...
  ]
  ```

## Developer guidelines

- Read the workspace guidelines here [../../docs/developer-guidelines.md](../../docs/developer-guidelines.md).
- Read the web platform guidelines here [./docs/developer-guidelines.md](./docs/developer-guidelines.md).
