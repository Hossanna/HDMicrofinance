# HD Microfinance Backend

Express and MongoDB backend for customer onboarding, account management, and core banking operations using a NibssByPhoenix-compatible API integration.

## Features

- Customer registration
- NIN & BVN onboarding and validation
- Customer KYC management
- Bank account creation
- Account balance enquiry
- Account name enquiry
- Fund transfers
- Transaction tracking
- NIBSS by Phoenix integration

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- NIBSS by Phoenix API
- Postman

## Project Structure

├── Controllers/
├── Models/
├── Services/
├── Routes/
├── Middleware/
├── Utils/
├── index.js
├── server.js
├── .env
└── package.json

## Setup

1. Clone the project and install dependencies:

```bash
npm install
```

2. Create your `.env` file:
PORT=8000 MONGO_URL=mongodb://localhost:27017/microfinanceBank JWT_SECRET=your_jwt_secret JWT_EXPIRES_IN=1h NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com NIBSS_CLIENT_ID=your_api_key NIBSS_CLIENT_SECRET=your_api_secret

3. Start the server:

```bash
npm run dev
```

## Main Routes

- `POST /api/auth/token` - generate a JWT token.
- `POST /api/fintech/onboard` - onboard a fintech.
- `POST api/identity/insert-bvn` - insert a new BVN test record.
- `POST api/identity/insert-nin` - create a NIN test record.
- `POST /api/identity/validate-nin` - validate a NIN test record.
- `POST /api/identity/validate-bvn` - validate a BVN test record.

- `POST /api/customers/onboard` - onboard a customer and verify BVN or NIN.
- `GET /api/customers` - list customers.
- `GET /api/customers/:id` - get a customer with accounts.

- `POST /api/accounts/create` - create an account using verified KYC.
- `GET /api/accounts/:id` - get account details.
- `GET /api/accounts` - get all fintech accounts.

- `GET /api/accounts/name-enquiry/:accountNumber` - get account name.
- `GET /api/accounts/balance/:accountNumber` - get account balance.
- `POST /api/accounts/transfer` - transfer funds.
- `GET /api/accounts/transactions/:reference` - get transactions by reference.


## Onboarding Rule

Account creation is blocked until a customer has a successful BVN or NIN verification. 
Multiple customers cannot have the same BVN or NIN.  
