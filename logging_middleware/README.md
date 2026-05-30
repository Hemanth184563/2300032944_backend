# Logging Middleware Package

This package is a reusable logger designed for Node.js applications. It provides structured validation on logging scopes and dispatches payloads to a remote logging API.

## Installation

Ensure you have your environment configured correctly.

```bash
cd logging_middleware
npm install
```

## Configuration

Create a `.env` file in the root of the logging middleware package:

```env
ACCESS_TOKEN=your_jwt_access_token_here
LOGGING_API_URL=http://localhost:3000/api/logs
```

## API Reference

### `Log(stack, level, packageName, message)`

Asynchronously sends a validated log payload to the remote API.

#### Parameters
- **`stack`** (`string`): Allowed values: `"backend"`, `"frontend"`.
- **`level`** (`string`): Allowed values: `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`.
- **`packageName`** (`string`): Required when stack is `"backend"`. Allowed values: `"cache"`, `"controller"`, `"cron_job"`, `"db"`, `"handler"`, `"repository"`, `"route"`, `"service"`.
- **`message`** (`string`): The log message string.

#### Return Value
Returns a Promise resolving to a `string` containing the registered `logID` on success, or a generated `FALLBACK-LOG-XXXXXX` on error.
