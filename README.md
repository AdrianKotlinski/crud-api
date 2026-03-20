# Product Catalog CRUD API - Adrian Kotlinski

A RESTful CRUD API for managing a product catalog, built with **Fastify** and an **in-memory store**. Supports single-instance and horizontally-scaled multi-worker modes.

## Table of Contents

[Requirements](#requirements)
[Installation](#installation)
[Configuration](#configuration)
[Running the Application](#running-the-application)
  [Development Mode](#development-mode)
  [Production Mode](#production-mode)
  [Multi-Worker Mode](#multi-worker-mode)
[API Reference](#api-reference)
  [Product Schema](#product-schema)
  [Endpoints](#endpoints)
  [Error Responses](#error-responses)
[Usage Examples](#usage-examples)
[Testing](#testing)
[Project Structure](#project-structure)

## Requirements

- **Node.js** `>= 24.10.0`
- **npm** `>= 10`

node --version

nvm install 24
nvm use 24


## Installation

```bash
git clone <repository-url>

cd crud-api

npm install
```

## Configuration

The application reads its configuration from a `.env` file in the project root.

**1. Create your `.env` file from the provided example:**

```bash
cp .env.example .env
```

**2. Edit `.env` to set your desired port:**

```env
PORT=4000
```

## Running the Application

### Development Mode

Uses `ts-node-dev` for fast TypeScript execution with automatic restarts on file changes.

```bash
npm run start:dev
```

The server starts at `http://localhost:4000` (or the port defined in `.env`).

### Production Mode

Compiles TypeScript to JavaScript via `tsc`, then runs the compiled output.

```bash
npm run start:prod
```

This runs two steps internally:
1. `npm run build` — compiles `src/` to `dist/`
2. `node dist/index.js` — runs the compiled server

### Multi-Worker Mode

Starts multiple worker instances using the **Node.js Cluster API** with a **round-robin load balancer**.

```bash
npm run start:multi
```

**How it works:**

| Process | Role | Port |
| Primary | Load balancer | `PORT` (e.g. `4000`) |
| Worker 1 | Fastify instance | `PORT + 1` (e.g. `4001`) |
| Worker 2 | Fastify instance | `PORT + 2` (e.g. `4002`) |
| Worker N | Fastify instance | `PORT + N` |

The number of workers equals `os.availableParallelism() - 1` (one less than the number of CPU threads on your machine).

**All requests go through the load balancer at `PORT`.** Workers are not meant to be called directly.

**State consistency:** When any worker mutates data (POST / PUT / DELETE), it broadcasts the updated state to the primary process, which fans it out to all other workers. This keeps the in-memory database consistent across all instances.

> To run multi-worker mode in production (compiled):
> ```bash
> npm run start:multi:prod
> ```

## API Reference

### Product Schema

Every product stored in the catalog has the following shape:

| Field | Type | Required | Constraints |
| `id` | `string` (UUID) | auto-generated | Set by the server, not accepted in request body |
| `name` | `string` | ✅ | Non-empty |
| `description` | `string` | ✅ | Non-empty |
| `price` | `number` | ✅ | Must be `> 0` |
| `category` | `string` | ✅ | Non-empty (e.g. `"electronics"`, `"books"`, `"clothing"`) |
| `inStock` | `boolean` | ✅ | |

**Example product object:**

```json
{
  "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
  "name": "Mechanical Keyboard",
  "description": "Tactile switches with RGB backlight",
  "price": 129.99,
  "category": "electronics",
  "inStock": true
}
```

### Endpoints

All endpoints are prefixed with `/api`.

#### `GET /api/products`

Returns all products in the catalog.

**Response**

| Status | Body | Condition |
| `200 OK` | Array of product objects | Always |

#### `GET /api/products/:productId`

Returns a single product by its ID.

**URL Parameters**

| Parameter | Type | Description |
| `productId` | UUID string | The ID of the product |

**Response**

| Status | Body | Condition |
| `200 OK` | Product object | Product found |
| `400 Bad Request` | `{ "message": "..." }` | `productId` is not a valid UUID |
| `404 Not Found` | `{ "message": "..." }` | No product with that ID exists |

#### `POST /api/products`

Creates a new product.

**Request Body** — `application/json`

```json
{
  "name": "Mechanical Keyboard",
  "description": "Tactile switches with RGB backlight",
  "price": 129.99,
  "category": "electronics",
  "inStock": true
}
```

All fields are required. The `id` is generated server-side and must not be included.

**Response**

| Status | Body | Condition |
|---|---|---|
| `201 Created` | Newly created product object (including `id`) | Success |
| `400 Bad Request` | `{ "message": "..." }` | Missing required field or `price <= 0` |

#### `PUT /api/products/:productId`

Updates an existing product. Only the fields provided in the request body are updated — all other fields retain their current values.

**URL Parameters**

| Parameter | Type | Description |
| `productId` | UUID string | The ID of the product to update |

**Request Body** — `application/json` (all fields optional)

```json
{
  "price": 149.99,
  "inStock": false
}
```

**Response**

| Status | Body | Condition |
| `200 OK` | Updated product object | Success |
| `400 Bad Request` | `{ "message": "..." }` | `productId` is not a valid UUID |
| `404 Not Found` | `{ "message": "..." }` | No product with that ID exists |

#### `DELETE /api/products/:productId`

Deletes a product from the catalog.

**URL Parameters**

| Parameter | Type | Description |
| `productId` | UUID string | The ID of the product to delete |

**Response**

| Status | Body | Condition |
| `204 No Content` | _(empty)_ | Product deleted successfully |
| `400 Bad Request` | `{ "message": "..." }` | `productId` is not a valid UUID |
| `404 Not Found` | `{ "message": "..." }` | No product with that ID exists |

### Error Responses

All error responses follow this shape:

```json
{
  "message": "Human-readable description of the error"
}
```

| Status | Meaning |
| `400 Bad Request` | Invalid input — bad UUID, missing field, invalid price |
| `404 Not Found` | Resource or route does not exist |
| `500 Internal Server Error` | Unexpected server-side failure |

Requests to routes that do not exist (e.g. `GET /some/random/path`) return `404` with a descriptive message.

## Usage Examples

The examples below are formatted for **Postman** so you can copy-paste quickly.

### Postman Setup (one time)

1. Create a new environment in Postman.
2. Add variable `baseUrl` = `http://localhost:4000`.
3. Use `{{baseUrl}}` in all request URLs below.

### 1) Get all products (empty catalog)

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/products`

**Expected response**
- Status: `200 OK`
- Body:

```json
[]
```

### 2) Create a product

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/products`  
**Headers:**
- `Content-Type: application/json`

**Body** (`raw` -> `JSON`)

```json
{
  "name": "Mechanical Keyboard",
  "description": "Tactile switches with RGB backlight",
  "price": 129.99,
  "category": "electronics",
  "inStock": true
}
```

**Expected response**
- Status: `201 Created`
- Body (example):

```json
{
  "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
  "name": "Mechanical Keyboard",
  "description": "Tactile switches with RGB backlight",
  "price": 129.99,
  "category": "electronics",
  "inStock": true
}
```

Save the returned `id` for the next requests.

### 3) Get product by ID

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/products/<productId>`

Replace `<productId>` with the `id` from step 2.

**Expected response**
- Status: `200 OK`
- Body: the product object

### 4) Update a product

**Method:** `PUT`  
**URL:** `{{baseUrl}}/api/products/<productId>`  
**Headers:**
- `Content-Type: application/json`

**Body**

```json
{
  "price": 99.99,
  "inStock": false
}
```

**Expected response**
- Status: `200 OK`
- Body: updated product object

### 5) Delete a product

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/products/<productId>`

**Expected response**
- Status: `204 No Content`
- Body: empty

### 6) Error scenario: non-existent route

**Method:** `GET`  
**URL:** `{{baseUrl}}/some/random/path`

**Expected response**
- Status: `404 Not Found`
- Body:

```json
{
  "message": "Route GET:/some/random/path not found"
}
```

### 7) Error scenario: invalid UUID

**Method:** `GET`
**URL:** `{{baseUrl}}/api/products/not-a-uuid`

**Expected response**
- Status: `400 Bad Request`
- Body:

```json
{
  "message": "productId must be a valid UUID"
}
```

## Testing

Tests are written with **Vitest** and **Supertest**. They run against a real Fastify instance in-process — no network required.

**Run all tests once:**
```bash
npm test
```

**Run tests in watch mode (re-runs on file change):**
```bash
npm run test:watch
```

**Test coverage includes:**

| Scenario | Covered |
| `GET /api/products` returns empty array | ✅ |
| `GET /api/products` returns all products | ✅ |
| `POST /api/products` creates a product | ✅ |
| `POST /api/products` rejects missing fields | ✅ |
| `POST /api/products` rejects `price <= 0` | ✅ |
| `GET /api/products/:id` returns existing product | ✅ |
| `GET /api/products/:id` returns 400 for invalid UUID | ✅ |
| `GET /api/products/:id` returns 404 for unknown ID | ✅ |
| `PUT /api/products/:id` updates and returns product | ✅ |
| `PUT /api/products/:id` returns 400 for invalid UUID | ✅ |
| `PUT /api/products/:id` returns 404 for unknown ID | ✅ |
| `DELETE /api/products/:id` deletes product | ✅ |
| `DELETE /api/products/:id` returns 400 for invalid UUID | ✅ |
| `DELETE /api/products/:id` returns 404 for unknown ID | ✅ |
| Full CRUD lifecycle (create → read → update → delete → 404) | ✅ |
| Unknown route returns 404 | ✅ |

## Project Structure

```
crud-api/
├── src/
│   ├── index.ts                      # Single-instance entry point
│   ├── cluster.ts                    # Multi-worker entry point (Cluster API + load balancer)
│   ├── app.ts                        # Fastify app factory (buildApp)
│   ├── config.ts                     # Environment variable loading and validation
│   ├── db/
│   │   └── product-store.ts          # In-memory Map-based data store
│   ├── routes/
│   │   └── products/
│   │       ├── index.ts              # Route registration
│   │       ├── handlers.ts           # Request handler functions
│   │       └── schema.ts             # Fastify/AJV JSON schemas for validation
│   └── types/
│       └── product.ts                # Product interface and DTO types
├── test/
│   └── products.test.ts              # Integration tests (Vitest + Supertest)
├── .env.example                      # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```
