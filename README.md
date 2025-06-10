# TypeScript Express API

A RESTful API built with TypeScript and Express.js.

## Features

- TypeScript support
- Express.js framework
- CORS enabled
- Environment variables support
- Basic CRUD operations
- Error handling
- User management endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add:
```
PORT=3000
NODE_ENV=development
```

## Development

To start the development server:

```bash
npm run dev
```

## Build

To build the project:

```bash
npm run build
```

## Production

To start the production server:

```bash
npm start
```

## API Endpoints

### Users

- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get user by ID
- POST `/api/users` - Create a new user
- PUT `/api/users/:id` - Update a user
- DELETE `/api/users/:id` - Delete a user

## Testing

To run tests:

```bash
npm test
``` 