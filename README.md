# HD Microfinance Backend

Express and MongoDB backend for customer onboarding, account management, and core banking operations using a NibssByPhoenix-compatible API integration.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file from `.env.example`.

3. Start the server:

```bash
npm run dev
```

## Main Routes

- `POST /api/auth/token` - generate a JWT token.
- `POST /api/fintech/onboard` - onboard a fintech.
- `GET /api/account/name-enquiry/:accountNumber` - get account name.
- `POST /api/transfer` - transfer funds.
- `GET /api/transaction/:ref` - get transaction by reference.
- `GET /api/accounts` - get all fintech accounts.
- `GET /api/account/balance/:accountNumber` - get account balance.
- `POST /api/insertBvn` - insert a new BVN test record.
- `POST /api/insertNin` - create a NIN test record.
- `POST /api/validateNin` - validate a NIN test record.
- `POST /api/validateBvn` - validate a BVN test record.
- `POST /api/account/create` - create an account using verified KYC.
- `POST /api/customers/onboard` - onboard a customer and verify BVN or NIN.
- `POST /api/customers/:id/verify-identity` - verify BVN or NIN for an existing customer.
- `GET /api/customers` - list customers.
- `GET /api/customers/:id` - get a customer with accounts.
- `PATCH /api/customers/:id/kyc` - update KYC level or status.
- `POST /api/accounts` - create another account for an existing customer.
- `GET /api/accounts` - list accounts.
- `GET /api/accounts/:id` - get account details.
- `POST /api/accounts/:id/refresh` - refresh account data from NibssByPhoenix.
- `POST /api/banking/name-enquiry` - resolve a destination account name.
- `POST /api/banking/transfer` - submit an interbank transfer.
- `POST /api/banking/notifications` - receive transaction notifications.
- `GET /api/transactions` - list local transaction records.
- `GET /api/transactions/:id` - get one local transaction record.
- `GET /api/transactions/reference/:reference/check` - check provider transaction status.
- `GET /api/transactions/accounts/:accountId/provider` - fetch provider transaction history.

## Onboarding Rule

Account creation is blocked until a customer has a successful BVN or NIN verification. Real BVN/NIN values are rejected; use sandbox values from `NIBSS_TEST_BVNS` and `NIBSS_TEST_NINS`.
