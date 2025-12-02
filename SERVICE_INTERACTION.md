# BookVerse Microservice Interaction Guide

This comprehensive document explains how all microservices in the BookVerse system interact with each other, including API flows, authentication patterns, service-to-service communication, and data dependencies.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Microservice Inventory](#microservice-inventory)
3. [API Gateway: The Central Hub](#api-gateway-the-central-hub)
4. [Authentication Flow](#authentication-flow)
5. [Service-to-Service Communication](#service-to-service-communication)
6. [Complete User Journey](#complete-user-journey)
7. [Detailed Interaction Flows](#detailed-interaction-flows)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

BookVerse is built using a **microservices architecture** where each service has a single responsibility and communicates via HTTP REST APIs. All client requests flow through the API Gateway, which handles routing, authentication, and request enrichment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                      │
│                          (Angular Application)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY                                     │
│                          (Port 3000/3005)                                   │
│  • JWT Validation          • Routing            • Request Proxying          │
│  • User Context Injection  • Rate Limiting      • Service Discovery         │
└───────────┬─────────┬──────────┬──────────┬─────────────────────────────────┘
            │         │          │          │
            ▼         ▼          ▼          ▼
    ┌───────────┐ ┌────────┐ ┌──────┐ ┌──────────┐
    │   Auth    │ │  Book  │ │ Cart │ │  Order   │
    │  Service  │ │Service │ │Service│ │ Service  │
    │(Port 5000)│ │(3004)  │ │(3001) │ │  (3002)  │
    └─────┬─────┘ └───┬────┘ └───┬───┘ └─────┬────┘
          │           │          │           │
          ▼           ▼          ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
    │ User DB │ │ Book DB │ │Cart DB │ │Order DB │
    │(MongoDB)│ │(MongoDB)│ │(MongoDB)│ │(MongoDB)│
    └─────────┘ └─────────┘ └────────┘ └─────────┘

Service-to-Service Communication:
    Cart Service ──────GET──────> Book Service (fetch book details)
    Order Service ─────GET──────> Cart Service (fetch cart)
    Order Service ────DELETE────> Cart Service (clear cart)
```

---

## Microservice Inventory

### 1. **API Gateway** (Port 3000/3005)

- **Role:** Central entry point and request router
- **Key Responsibilities:**
  - Routes all frontend requests to appropriate services
  - Validates JWT tokens for protected routes
  - Injects user context (`x-user-id`, `x-user-role`, `x-user-email`) into headers
  - Proxies requests to backend services
  - Handles CORS, rate limiting, and logging
- **Routes:**
  - `/v1/auth` → Auth Service (public)
  - `/v1/user` → Auth Service (protected)
  - `/v1/books` → Book Service (public)
  - `/v1/cart` → Cart Service (protected)
  - `/v1/orders` → Order Service (protected)
- **Dependencies:** All backend services
- **Database:** None

### 2. **Auth Service** (Port 5000)

- **Role:** User authentication and identity management
- **Key Responsibilities:**
  - User registration and login
  - JWT token generation (access + refresh tokens)
  - Password hashing and validation
  - User profile management
  - Token refresh and logout
- **Endpoints:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh-token`
  - `GET /api/user/profile`
  - `PUT /api/user/profile`
- **Dependencies:** None (standalone)
- **Database:** `auth-service` (Users collection)

### 3. **Book Service** (Port 3004)

- **Role:** Book catalog and inventory management
- **Key Responsibilities:**
  - Store and manage book information
  - Provide book browsing and search
  - Handle CRUD operations for books (admin only)
  - Serve book details to other services
- **Endpoints:**
  - `GET /api/books` (list all books)
  - `GET /api/books/:id` (get single book)
  - `POST /api/books` (admin only)
  - `PUT /api/books/:id` (admin only)
  - `DELETE /api/books/:id` (admin only)
- **Dependencies:** None (standalone)
- **Database:** `book-service` (Books collection)
- **Called By:** Cart Service, Order Service (indirect)

### 4. **Cart Service** (Port 3001)

- **Role:** Shopping cart management for users
- **Key Responsibilities:**
  - Maintain user shopping carts
  - Add/remove/update cart items
  - Validate book existence before adding
  - Enrich cart items with current book details
  - Clear cart after order completion
- **Endpoints:**
  - `GET /api/cart` (get user's cart)
  - `POST /api/cart/add` (add item to cart)
  - `PUT /api/cart/:itemId` (update quantity)
  - `DELETE /api/cart/:itemId` (remove item)
  - `DELETE /api/cart/clear` (clear cart - service-to-service)
- **Dependencies:** Book Service (fetches book details)
- **Database:** `cart-service` (Carts + CartItems collections)
- **Called By:** Order Service

### 5. **Order Service** (Port 3002)

- **Role:** Order processing and history management
- **Key Responsibilities:**
  - Create orders from user carts
  - Store order history with payment info
  - Manage order status (pending/success/fail)
  - Provide order history to users
  - Admin order management
- **Endpoints:**
  - `POST /api/orders` (create order)
  - `GET /api/orders` (get user's orders)
  - `GET /api/orders/all` (admin only)
  - `PUT /api/orders/:id/status` (admin only)
- **Dependencies:** Cart Service (fetch and clear cart)
- **Database:** `order-service` (Orders collection)

---

## API Gateway: The Central Hub

The API Gateway is the **single entry point** for all client requests. It acts as a reverse proxy and authentication layer.

### Routing Configuration

```javascript
// From: backend/api-gateway/src/config/services.js
const routeConfig = [
  {
    path: "/v1/auth",
    service: "http://auth-service:5000",
    requiresAuth: false,
    description: "Authentication endpoints (login, register, etc.)",
  },
  {
    path: "/v1/user",
    service: "http://auth-service:5000",
    requiresAuth: true,
    description: "User profile management",
  },
  {
    path: "/v1/books",
    service: "http://book-service:3004",
    requiresAuth: false,
    description: "Book catalog (public browsing)",
  },
  {
    path: "/v1/cart",
    service: "http://cart-service:3001",
    requiresAuth: true,
    description: "Shopping cart operations",
  },
  {
    path: "/v1/orders",
    service: "http://order-service:3002",
    requiresAuth: true,
    description: "Order management",
  },
];
```

### Request Processing Pipeline

1. **Receive Request** from frontend
2. **CORS Handling** (allow credentials, specific origins)
3. **Authentication Check:**
   - If route requires auth → validate JWT token
   - Extract user info from token payload
   - Inject headers: `x-user-id`, `x-user-role`, `x-user-email`
4. **Route Matching** based on path prefix
5. **Proxy Request** to target service
6. **Return Response** to client

---

## Authentication Flow

### User Authentication with JWT

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │ Auth Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                       │
     │ POST /v1/auth/login  │                       │
     │ {email, password}    │                       │
     ├─────────────────────>│                       │
     │                      │ POST /api/auth/login  │
     │                      │ {email, password}     │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │                       │ Validate credentials
     │                      │                       │ Hash password & compare
     │                      │                       │ Generate JWT tokens:
     │                      │                       │   - accessToken (15m)
     │                      │                       │   - refreshToken (7d)
     │                      │                       │
     │                      │  200 OK               │
     │                      │  {accessToken,        │
     │                      │   refreshToken,       │
     │                      │   user}               │
     │                      │<──────────────────────┤
     │  200 OK              │                       │
     │  Set-Cookie: token=JWT                       │
     │<─────────────────────┤                       │
     │                      │                       │
     │ Store token in cookie│                       │
     │                      │                       │
```

**JWT Payload:**

```json
{
  "id": "user123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1701432000,
  "exp": 1701433000
}
```

### Protected Route Access

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │ Cart Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                       │
     │ GET /v1/cart         │                       │
     │ Cookie: token=JWT    │                       │
     ├─────────────────────>│                       │
     │                      │                       │
     │                      │ Validate JWT          │
     │                      │ Extract user info     │
     │                      │                       │
     │                      │ GET /api/cart         │
     │                      │ Headers:              │
     │                      │   x-user-id: user123  │
     │                      │   x-user-role: user   │
     │                      │   x-user-email: ...   │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │                       │ Use x-user-id
     │                      │                       │ to fetch cart
     │                      │                       │
     │                      │  200 OK {cart}        │
     │                      │<──────────────────────┤
     │  200 OK {cart}       │                       │
     │<─────────────────────┤                       │
     │                      │                       │
```

**Key Points:**

- API Gateway validates JWT and extracts user info
- Backend services **do not validate JWT** (trust gateway)
- User context passed via `x-user-*` headers
- Services use `x-user-id` to filter data by user

---

## Service-to-Service Communication

Unlike client-to-gateway communication, services communicate **directly** with each other using internal URLs (Docker network).

### Pattern 1: Cart Service → Book Service

**Purpose:** Validate book existence and fetch details

```javascript
// From: backend/cart-service/src/controllers/cart.controller.js
const BOOK_SERVICE_URL =
  process.env.BOOK_SERVICE_URL || "http://localhost:3004/api/books";

const fetchBookDetails = async (bookId) => {
  try {
    const response = await axios.get(`${BOOK_SERVICE_URL}/${bookId}`);
    return response.data;
  } catch (err) {
    console.warn(`Book not found: ${bookId}`);
    return null;
  }
};
```

**When Called:**

- Adding item to cart (validate book exists)
- Fetching cart (enrich items with current book data)

**Example:**

```
Cart Service                 Book Service
     │                            │
     │ GET /api/books/507f...     │
     ├───────────────────────────>│
     │                            │
     │                            │ Query MongoDB
     │                            │
     │  200 OK {book details}     │
     │<───────────────────────────┤
     │                            │
```

### Pattern 2: Order Service → Cart Service

**Purpose:** Fetch cart items and clear cart after order

```javascript
// From: backend/order-service/src/controllers/order.controller.js
const CART_SERVICE_URL = process.env.CART_SERVICE_URL;
const CART_SERVICE_TOKEN = process.env.CART_SERVICE_TOKEN;

// Step 1: Fetch cart
const cartResponse = await axios.get(`${CART_SERVICE_URL}/cart`, {
  headers: {
    "x-user-id": req.user.id,
    "x-user-role": req.user.role,
    "x-user-email": req.user.email,
  },
});

// Step 2: Clear cart after order created
await axios.delete(`${CART_SERVICE_URL}/cart/clear`, {
  headers: { "X-Service-Token": CART_SERVICE_TOKEN },
  data: { userId },
});
```

**When Called:**

- Creating order (fetch cart, then clear it)

**Example:**

```
Order Service                Cart Service                Book Service
     │                            │                            │
     │ GET /api/cart              │                            │
     │ Headers: x-user-id         │                            │
     ├───────────────────────────>│                            │
     │                            │ For each cart item:        │
     │                            │ GET /api/books/:id         │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │  {book details}            │
     │                            │<───────────────────────────┤
     │  {cart with books}         │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ [Create order in DB]       │                            │
     │                            │                            │
     │ DELETE /api/cart/clear     │                            │
     │ Headers: X-Service-Token   │                            │
     ├───────────────────────────>│                            │
     │                            │ Delete cart items          │
     │                            │                            │
     │  200 OK                    │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
```

**Security Note:**

- Service-to-service calls use `X-Service-Token` for authentication
- Prevents external clients from clearing carts directly

---

## Complete User Journey

author: "F. Scott Fitzgerald",
price: 15.99,
category: "Fiction",
description: "A classic American novel...",
publication_year: 1925,
image_url: "https://example.com/gatsby.jpg"
}

````

### Cart Service (Port 3001)

**What it does**:

- Manages shopping carts for authenticated users
- Stores cart items with quantity information
- Validates book existence before adding to cart
- Calculates cart totals
- Clears cart after order completion

**Database**: `cart-service` with two collections:

- `carts`: One per user
- `cartitems`: Multiple items per cart

**Key Data**:

```javascript
// Cart
{
  _id: "507f1f77bcf86cd799439012",
  user: "user123",
  createdAt: "2025-12-01T10:00:00Z"
}

// Cart Item
{
  _id: "507f1f77bcf86cd799439013",
  cart: "507f1f77bcf86cd799439012",
  book: "507f1f77bcf86cd799439011", // Book ID from book-service
  quantity: 2
}
````

**Dependencies**:

- Calls **Book Service** to fetch book details and validate existence

### Order Service (Port 3002)

**What it does**:

- Creates orders from cart items
- Stores order history with payment information
- Manages order status (pending/success/fail)
- Provides order history to users
- Allows admin to view all orders and update status

**Database**: `order-service` collection with order documents

**Key Data**:

```javascript
{
  _id: "507f1f77bcf86cd799439014",
  userId: "user123",
  items: [
    {
      bookId: "507f1f77bcf86cd799439011",
      title: "The Great Gatsby",
      quantity: 2,
      price: 15.99
    }
  ],
  totalPrice: 31.98,
  name: "John Doe",
  shippingAddress: "123 Main St, City, State 12345",
  orderNote: "Please handle with care",
  status: "pending",
  payment: {
    cardNumber: "****1234",
    CVV: "***",
    expiredDate: "12/26"
  },
  createdAt: "2025-12-01T10:30:00Z"
}
```

**Dependencies**:

- Calls **Cart Service** to fetch cart items
- Calls **Cart Service** to clear cart after order creation

---

## User Journey

### Step-by-Step Shopping Flow

```
1. Browse Books
   │
   ├─> User visits homepage
   ├─> Frontend calls Book Service via API Gateway
   └─> Displays book catalog

2. Add to Cart
   │
   ├─> User clicks "Add to Cart" on a book
   ├─> Frontend calls Cart Service via API Gateway
   ├─> Cart Service validates book exists (calls Book Service)
   └─> Cart Service adds item to user's cart

3. View Cart
   │
   ├─> User navigates to cart page
   ├─> Frontend calls Cart Service via API Gateway
   ├─> Cart Service fetches cart items
   ├─> For each item, Cart Service calls Book Service to get current details
   └─> Frontend displays cart with book details and quantities

4. Checkout
   │
   ├─> User enters payment and shipping information
   ├─> Frontend calls Order Service via API Gateway
   ├─> Order Service fetches cart from Cart Service
   ├─> Cart Service enriches items with book details from Book Service
   ├─> Order Service creates order with all information
   ├─> Order Service calls Cart Service to clear the cart
   └─> User receives order confirmation

5. Order History
   │
   ├─> User views profile/orders page
   ├─> Frontend calls Order Service via API Gateway
   └─> Order Service returns user's order history with status
```

---

## Detailed Interaction Flows

### Flow 1: Browse Books

**Scenario**: User wants to see available books

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │ Book Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                       │
     │ GET /v1/books        │                       │
     ├─────────────────────>│                       │
     │                      │ GET /api/books        │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │                       │ Fetch from DB
     │                      │                       │
     │                      │   200 OK              │
     │                      │   [{books array}]     │
     │                      │<──────────────────────┤
     │  200 OK              │                       │
     │  [{books array}]     │                       │
     │<─────────────────────┤                       │
     │                      │                       │
     │ Display books        │                       │
     │                      │                       │
```

**Request**:

```http
GET /v1/books HTTP/1.1
Host: localhost:3000
```

**Response**:

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 15.99,
    "category": "Fiction",
    "description": "A classic American novel...",
    "publication_year": 1925,
    "image_url": "https://example.com/gatsby.jpg"
  }
]
```

---

### Flow 2: Add Book to Cart

**Scenario**: User adds a book to their shopping cart

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │ Cart Service │         │ Book Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘         └──────┬───────┘
     │                      │                       │                        │
     │ POST /v1/cart/add    │                       │                        │
     │ {bookId: "123"}      │                       │                        │
     ├─────────────────────>│                       │                        │
     │                      │ Validate JWT          │                        │
     │                      │ Extract user info     │                        │
     │                      │                       │                        │
     │                      │ POST /api/cart/add    │                        │
     │                      │ + x-user-id header    │                        │
     │                      ├──────────────────────>│                        │
     │                      │                       │ GET /api/books/123     │
     │                      │                       ├───────────────────────>│
     │                      │                       │                        │
     │                      │                       │  200 OK {book}         │
     │                      │                       │<───────────────────────┤
     │                      │                       │                        │
     │                      │                       │ Create/Update cart     │
     │                      │                       │ Add cart item          │
     │                      │                       │                        │
     │                      │  200 OK               │                        │
     │                      │  {cart items}         │                        │
     │                      │<──────────────────────┤                        │
     │  200 OK              │                       │                        │
     │  {cart items}        │                       │                        │
     │<─────────────────────┤                       │                        │
     │                      │                       │                        │
     │ Update cart badge    │                       │                        │
     │                      │                       │                        │
```

**Request**:

```http
POST /v1/cart/add HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "bookId": "507f1f77bcf86cd799439011",
  "quantity": 1
}
```

**Cart Service → Book Service** (internal):

```http
GET /api/books/507f1f77bcf86cd799439011 HTTP/1.1
Host: book-service:3004
```

**Response**:

```json
{
  "message": "Item added to cart",
  "items": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "book": "507f1f77bcf86cd799439011",
      "quantity": 1
    }
  ]
}
```

**Why Book Service is called**:

- Cart Service validates the book exists before adding
- Prevents adding invalid or deleted book IDs
- Ensures data integrity

---

### Flow 3: View Cart with Book Details

**Scenario**: User opens cart page to review items

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │ Cart Service │         │ Book Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘         └──────┬───────┘
     │                      │                       │                        │
     │ GET /v1/cart         │                       │                        │
     ├─────────────────────>│                       │                        │
     │                      │ Validate JWT          │                        │
     │                      │                       │                        │
     │                      │ GET /api/cart         │                        │
     │                      │ + x-user-id           │                        │
     │                      ├──────────────────────>│                        │
     │                      │                       │ Find user's cart       │
     │                      │                       │ Find cart items        │
     │                      │                       │                        │
     │                      │                       │ For each item:         │
     │                      │                       │ GET /api/books/:bookId │
     │                      │                       ├───────────────────────>│
     │                      │                       │                        │
     │                      │                       │  {book details}        │
     │                      │                       │<───────────────────────┤
     │                      │                       │                        │
     │                      │                       │ Combine item + book    │
     │                      │                       │ Calculate subtotal     │
     │                      │                       │                        │
     │                      │  200 OK               │                        │
     │                      │  {enriched cart}      │                        │
     │                      │<──────────────────────┤                        │
     │  200 OK              │                       │                        │
     │  {enriched cart}     │                       │                        │
     │<─────────────────────┤                       │                        │
     │                      │                       │                        │
     │ Display cart items   │                       │                        │
     │ Show: title, price,  │                       │                        │
     │ quantity, subtotal   │                       │                        │
     │                      │                       │                        │
```

**Request**:

```http
GET /v1/cart HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

**Response** (enriched with book details):

```json
{
  "message": "Cart retrieved successfully",
  "items": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "book": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "price": 15.99,
        "image_url": "https://example.com/gatsby.jpg"
      },
      "subtotal": 31.98
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "quantity": 1,
      "book": {
        "_id": "507f1f77bcf86cd799439016",
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "price": 12.99,
        "image_url": "https://example.com/mockingbird.jpg"
      },
      "subtotal": 12.99
    }
  ],
  "total": 44.97
}
```

**Why Book Service is called for each item**:

- Fetches current book information (price, title, availability)
- Ensures cart displays up-to-date data
- Price may have changed since item was added
- Book details not stored in cart (only book ID)

---

### Flow 4: Checkout and Create Order

**Scenario**: User completes purchase from cart

```
┌──────────┐      ┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Frontend │      │ API Gateway │      │Order Service │      │ Cart Service │      │ Book Service │
└────┬─────┘      └──────┬──────┘      └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
     │                   │                     │                     │                     │
     │ POST /v1/orders   │                     │                     │                     │
     │ {payment, address}│                     │                     │                     │
     ├──────────────────>│                     │                     │                     │
     │                   │ Validate JWT        │                     │                     │
     │                   │                     │                     │                     │
     │                   │ POST /api/orders    │                     │                     │
     │                   │ + x-user-id         │                     │                     │
     │                   ├────────────────────>│                     │                     │
     │                   │                     │ GET /api/cart       │                     │
     │                   │                     │ + x-user-id header  │                     │
     │                   │                     ├────────────────────>│                     │
     │                   │                     │                     │ For each cart item: │
     │                   │                     │                     │ GET /api/books/:id  │
     │                   │                     │                     ├────────────────────>│
     │                   │                     │                     │                     │
     │                   │                     │                     │  {book details}     │
     │                   │                     │                     │<────────────────────┤
     │                   │                     │                     │                     │
     │                   │                     │  {cart with books}  │                     │
     │                   │                     │<────────────────────┤                     │
     │                   │                     │                     │                     │
     │                   │                     │ Validate cart not empty                   │
     │                   │                     │ Calculate total                           │
     │                   │                     │ Create order document                     │
     │                   │                     │ Save to database                          │
     │                   │                     │                     │                     │
     │                   │                     │ DELETE /api/cart/clear                    │
     │                   │                     │ + x-service-token   │                     │
     │                   │                     ├────────────────────>│                     │
     │                   │                     │                     │ Delete cart items   │
     │                   │                     │                     │                     │
     │                   │                     │  200 OK             │                     │
     │                   │                     │<────────────────────┤                     │
     │                   │                     │                     │                     │
     │                   │  201 Created        │                     │                     │
     │                   │  {order}            │                     │                     │
     │                   │<────────────────────┤                     │                     │
     │  201 Created      │                     │                     │                     │
     │  {order}          │                     │                     │                     │
     │<──────────────────┤                     │                     │                     │
     │                   │                     │                     │                     │
     │ Navigate to       │                     │                     │                     │
     │ order success page│                     │                     │                     │
     │                   │                     │                     │                     │
```

**Request**:

```http
POST /v1/orders HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "John Doe",
  "shippingAddress": "123 Main St, City, State 12345",
  "orderNote": "Please handle with care",
  "payment": {
    "cardNumber": "4111111111111111",
    "CVV": "123",
    "expiredDate": "12/26"
  }
}
```

**Order Service → Cart Service** (step 1):

```http
GET /api/cart HTTP/1.1
Host: cart-service:3001
x-user-id: user123
```

**Cart Service Response** (with book details):

```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "book": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "The Great Gatsby",
        "price": 15.99
      }
    }
  ],
  "total": 31.98
}
```

**Order Service → Cart Service** (step 2 - clear cart):

```http
DELETE /api/cart/clear HTTP/1.1
Host: cart-service:3001
x-user-id: user123
x-service-token: secret-service-token
```

**Response**:

```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "user123",
    "items": [
      {
        "bookId": "507f1f77bcf86cd799439011",
        "title": "The Great Gatsby",
        "quantity": 2,
        "price": 15.99
      }
    ],
    "totalPrice": 31.98,
    "status": "pending",
    "createdAt": "2025-12-01T10:30:00Z"
  }
}
```

**Service Interactions**:

1. Order Service fetches cart from Cart Service
2. Cart Service enriches items with book details from Book Service
3. Order Service creates order document
4. Order Service clears cart using service-to-service token
5. User cart is now empty, ready for next shopping session

---

### Flow 5: View Order History

**Scenario**: User checks their past orders

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Frontend │         │ API Gateway │         │Order Service │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                       │
     │ GET /v1/orders       │                       │
     ├─────────────────────>│                       │
     │                      │ Validate JWT          │
     │                      │                       │
     │                      │ GET /api/orders       │
     │                      │ + x-user-id           │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │                       │ Query orders by userId
     │                      │                       │ Sort by createdAt desc
     │                      │                       │
     │                      │  200 OK               │
     │                      │  [{orders}]           │
     │                      │<──────────────────────┤
     │  200 OK              │                       │
     │  [{orders}]          │                       │
     │<─────────────────────┤                       │
     │                      │                       │
     │ Display orders with: │                       │
     │ - Status badge       │                       │
     │ - Items list         │                       │
     │ - Total price        │                       │
     │ - Order date         │                       │
     │                      │                       │
```

**Request**:

```http
GET /v1/orders HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGciOiJIUzI1NiIs...
```

**Response**:

```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "user123",
    "items": [
      {
        "bookId": "507f1f77bcf86cd799439011",
        "title": "The Great Gatsby",
        "quantity": 2,
        "price": 15.99
      }
    ],
    "totalPrice": 31.98,
    "name": "John Doe",
    "shippingAddress": "123 Main St, City, State 12345",
    "status": "success",
    "createdAt": "2025-12-01T10:30:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439017",
    "userId": "user123",
    "items": [
      {
        "bookId": "507f1f77bcf86cd799439016",
        "title": "To Kill a Mockingbird",
        "quantity": 1,
        "price": 12.99
      }
    ],
    "totalPrice": 12.99,
    "status": "pending",
    "createdAt": "2025-11-28T14:20:00Z"
  }
]
```

**Notes:**

- Order Service stores complete order snapshot (prices at time of purchase)
- No service-to-service calls needed (all data stored in order document)
- Orders are immutable once created

---

## API Endpoints Reference

### API Gateway Routes

| Path           | Target Service | Auth Required | Description              |
| -------------- | -------------- | ------------- | ------------------------ |
| `/v1/auth/*`   | Auth Service   | No            | Authentication endpoints |
| `/v1/user/*`   | Auth Service   | Yes           | User profile management  |
| `/v1/books/*`  | Book Service   | No            | Book catalog (public)    |
| `/v1/cart/*`   | Cart Service   | Yes           | Shopping cart operations |
| `/v1/orders/*` | Order Service  | Yes           | Order management         |

### Auth Service Endpoints

| Method | Endpoint                  | Auth | Description                  |
| ------ | ------------------------- | ---- | ---------------------------- |
| POST   | `/api/auth/register`      | No   | Create new user account      |
| POST   | `/api/auth/login`         | No   | Login and get JWT tokens     |
| POST   | `/api/auth/logout`        | Yes  | Logout and invalidate tokens |
| POST   | `/api/auth/refresh-token` | No   | Refresh access token         |
| GET    | `/api/user/profile`       | Yes  | Get user profile             |
| PUT    | `/api/user/profile`       | Yes  | Update user profile          |

### Book Service Endpoints

| Method | Endpoint         | Auth  | Description             |
| ------ | ---------------- | ----- | ----------------------- |
| GET    | `/api/books`     | No    | List all books          |
| GET    | `/api/books/:id` | No    | Get single book details |
| POST   | `/api/books`     | Admin | Create new book         |
| PUT    | `/api/books/:id` | Admin | Update book             |
| DELETE | `/api/books/:id` | Admin | Delete book             |

### Cart Service Endpoints

| Method | Endpoint            | Auth          | Description                          |
| ------ | ------------------- | ------------- | ------------------------------------ |
| GET    | `/api/cart`         | Yes           | Get user's cart with book details    |
| POST   | `/api/cart/add`     | Yes           | Add item to cart                     |
| PUT    | `/api/cart/:itemId` | Yes           | Update item quantity                 |
| DELETE | `/api/cart/:itemId` | Yes           | Remove item from cart                |
| DELETE | `/api/cart/clear`   | Service Token | Clear cart (service-to-service only) |

### Order Service Endpoints

| Method | Endpoint                 | Auth  | Description              |
| ------ | ------------------------ | ----- | ------------------------ |
| POST   | `/api/orders`            | Yes   | Create order from cart   |
| GET    | `/api/orders`            | Yes   | Get user's order history |
| GET    | `/api/orders/:id`        | Yes   | Get single order details |
| GET    | `/api/orders/all`        | Admin | Get all orders (admin)   |
| PUT    | `/api/orders/:id/status` | Admin | Update order status      |

---

## Error Handling & Edge Cases

### Cart Service Error Scenarios

**1. Book Not Found**

```json
// When adding non-existent book to cart
{
  "message": "Book not found or unavailable"
}
```

- Cart Service calls Book Service
- If 404 returned, reject add operation

**2. Empty Cart Checkout**

```json
{
  "message": "Cart is empty"
}
```

- Order Service checks cart before creating order
- Prevents empty orders

**3. Book Price Changed**

- Cart displays current prices from Book Service
- User sees updated price before checkout
- Order stores price snapshot at purchase time

### Authentication Errors

**1. Missing Token**

```json
{
  "message": "Authentication required"
}
```

- API Gateway returns 401
- Frontend redirects to login

**2. Expired Token**

```json
{
  "message": "Token expired"
}
```

- Frontend uses refresh token
- If refresh fails, redirect to login

**3. Invalid User ID**

```json
{
  "message": "Unauthorized: missing or invalid token"
}
```

- Order/Cart services verify `x-user-id` header exists
- Reject requests without valid user context

### Service-to-Service Errors

**1. Book Service Unavailable**

- Cart Service logs warning
- Returns cart items with placeholder book data
- Graceful degradation

**2. Cart Service Unavailable**

- Order Service cannot create order
- Returns 500 error with retry message

**3. Invalid Service Token**

```json
{
  "message": "Forbidden: Invalid service token"
}
```

- Cart Service validates `X-Service-Token` for clear operation
- Prevents unauthorized cart clearing

---

## Deployment Architecture

### Docker Compose Setup

All services run in Docker containers connected via a bridge network:

```yaml
# From: backend/docker-compose.yml
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - AUTH_SERVICE_URL=http://auth-service:5000
      - BOOK_SERVICE_URL=http://book-service:3004
      - CART_SERVICE_URL=http://cart-service:3001
      - ORDER_SERVICE_URL=http://order-service:3002

  auth-service:
    build: ./auth-service
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/auth-service

  book-service:
    build: ./book-service
    ports:
      - "3004:3004"
    environment:
      - MONGO_URI=mongodb://mongo:27017/book-service

  cart-service:
    build: ./cart-service
    ports:
      - "3001:3001"
    environment:
      - MONGO_URI=mongodb://mongo:27017/cart-service
      - BOOK_SERVICE_URL=http://book-service:3004/api/books

  order-service:
    build: ./order-service
    ports:
      - "3002:3002"
    environment:
      - MONGO_URI=mongodb://mongo:27017/order-service
      - CART_SERVICE_URL=http://cart-service:3001/api
      - CART_SERVICE_TOKEN=secret-service-token

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
```

### Network Communication

**Internal (Docker Network):**

- Services communicate using service names as hostnames
- Example: `http://book-service:3004`
- Fast, no external network required

**External (Host Machine):**

- Only API Gateway exposed to host: `localhost:3000`
- Frontend connects to API Gateway only
- Other services not directly accessible

### Environment Variables

Each service requires specific environment variables:

**API Gateway:**

- `AUTH_SERVICE_URL`, `BOOK_SERVICE_URL`, `CART_SERVICE_URL`, `ORDER_SERVICE_URL`
- `JWT_SECRET` (for token validation)

**Auth Service:**

- `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

**Book Service:**

- `MONGO_URI`

**Cart Service:**

- `MONGO_URI`, `BOOK_SERVICE_URL`

**Order Service:**

- `MONGO_URI`, `CART_SERVICE_URL`, `CART_SERVICE_TOKEN`

---

## Summary of Interactions

### Data Flow Matrix

| From          | To            | Purpose                | Method | Auth                         |
| ------------- | ------------- | ---------------------- | ------ | ---------------------------- |
| Frontend      | API Gateway   | All requests           | REST   | JWT Cookie                   |
| API Gateway   | Auth Service  | Login/Register/Profile | REST   | JWT (for profile)            |
| API Gateway   | Book Service  | Browse books           | REST   | None                         |
| API Gateway   | Cart Service  | Cart operations        | REST   | JWT (user headers)           |
| API Gateway   | Order Service | Order operations       | REST   | JWT (user headers)           |
| Cart Service  | Book Service  | Validate & fetch books | REST   | None                         |
| Order Service | Cart Service  | Fetch & clear cart     | REST   | User headers + Service token |

### Key Design Principles

1. **Single Entry Point:** API Gateway is the only public-facing service
2. **JWT Trust Model:** Gateway validates tokens, services trust injected headers
3. **Service Independence:** Each service has its own database
4. **Graceful Degradation:** Services handle dependency failures gracefully
5. **Data Enrichment:** Services fetch related data from other services as needed
6. **Service Tokens:** Inter-service calls use special tokens for security

---

**Frontend displays**:

- Order list sorted by date (newest first)
- Status badge:
  - 🟡 Yellow for "pending"
  - 🟢 Green for "success"
  - 🔴 Red for "fail"
- Items breakdown with quantities and prices
- Total price
- Shipping address

---

### Flow 6: Admin Updates Order Status

**Scenario**: Admin changes order status from pending to success

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│  Admin   │         │ API Gateway │         │Order Service │
│ Frontend │         │             │         │              │
└────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                      │                       │
     │ PATCH /v1/orders/:id/status                  │
     │ {status: "success"}  │                       │
     ├─────────────────────>│                       │
     │                      │ Validate JWT          │
     │                      │ Check role = "admin"  │
     │                      │                       │
     │                      │ PATCH /api/orders/:id/status
     │                      │ + x-user-role header  │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │                       │ Validate order exists
     │                      │                       │ Update status field
     │                      │                       │ Save to database
     │                      │                       │
     │                      │  200 OK               │
     │                      │  {updated order}      │
     │                      │<──────────────────────┤
     │  200 OK              │                       │
     │  {updated order}     │                       │
     │<─────────────────────┤                       │
     │                      │                       │
     │ Update order list    │                       │
     │ Show success message │                       │
     │                      │                       │

     [User visits profile page]

     │ GET /v1/orders       │                       │
     ├─────────────────────>│                       │
     │                      │ GET /api/orders       │
     │                      ├──────────────────────>│
     │                      │                       │
     │                      │  [{orders}]           │
     │                      │<──────────────────────┤
     │  [{orders}]          │                       │
     │<─────────────────────┤                       │
     │                      │                       │
     │ User sees updated    │                       │
     │ status: "success" ✅ │                       │
     │                      │                       │
```

**Admin Request**:

```http
PATCH /v1/orders/507f1f77bcf86cd799439014/status HTTP/1.1
Host: localhost:3000
Cookie: token=eyJhbGciOiJIUzI1NiIs... (admin token)
Content-Type: application/json

{
  "status": "success"
}
```

**Response**:

```json
{
  "message": "Order status updated successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "success",
    "updatedAt": "2025-12-01T11:00:00Z"
  }
}
```

**Result**:

- Admin sees updated status in dashboard
- User sees green "success" badge in order history
- Status persists across sessions

---

## Sequence Diagrams

### Complete Shopping Flow

```
User                Frontend            API Gateway         Book Service        Cart Service        Order Service
 │                     │                     │                     │                   │                   │
 │ 1. Browse books     │                     │                     │                   │                   │
 │────────────────────>│                     │                     │                   │                   │
 │                     │ GET /v1/books       │                     │                   │                   │
 │                     │────────────────────>│ GET /api/books      │                   │                   │
 │                     │                     │────────────────────>│                   │                   │
 │                     │                     │    [{books}]        │                   │                   │
 │                     │    [{books}]        │<────────────────────┤                   │                   │
 │    Book list        │<────────────────────┤                     │                   │                   │
 │<────────────────────┤                     │                     │                   │                   │
 │                     │                     │                     │                   │                   │
 │ 2. Add to cart      │                     │                     │                   │                   │
 │────────────────────>│ POST /v1/cart/add   │                     │                   │                   │
 │                     │────────────────────>│ POST /api/cart/add  │                   │                   │
 │                     │                     │────────────────────────────────────────>│                   │
 │                     │                     │                     │ GET /api/books/:id│                   │
 │                     │                     │                     │<──────────────────┤                   │
 │                     │                     │                     │   {book}          │                   │
 │                     │                     │                     │──────────────────>│                   │
 │                     │                     │    {cart items}     │                   │                   │
 │                     │    {cart items}     │<────────────────────────────────────────┤                   │
 │    Success          │<────────────────────┤                     │                   │                   │
 │<────────────────────┤                     │                     │                   │                   │
 │                     │                     │                     │                   │                   │
 │ 3. View cart        │                     │                     │                   │                   │
 │────────────────────>│ GET /v1/cart        │                     │                   │                   │
 │                     │────────────────────>│ GET /api/cart       │                   │                   │
 │                     │                     │────────────────────────────────────────>│                   │
 │                     │                     │                     │ (for each item)   │                   │
 │                     │                     │                     │ GET /api/books/:id│                   │
 │                     │                     │                     │<──────────────────┤                   │
 │                     │                     │                     │   {book}          │                   │
 │                     │                     │                     │──────────────────>│                   │
 │                     │                     │  {enriched cart}    │                   │                   │
 │                     │  {enriched cart}    │<────────────────────────────────────────┤                   │
 │    Cart details     │<────────────────────┤                     │                   │                   │
 │<────────────────────┤                     │                     │                   │                   │
 │                     │                     │                     │                   │                   │
 │ 4. Checkout         │                     │                     │                   │                   │
 │────────────────────>│ POST /v1/orders     │                     │                   │                   │
 │                     │────────────────────>│ POST /api/orders    │                   │                   │
 │                     │                     │────────────────────────────────────────────────────────────>│
 │                     │                     │                     │                   │ GET /api/cart     │
 │                     │                     │                     │                   │<──────────────────┤
 │                     │                     │                     │ (fetch books)     │                   │
 │                     │                     │                     │<──────────────────┤                   │
 │                     │                     │                     │   {books}         │                   │
 │                     │                     │                     │──────────────────>│                   │
 │                     │                     │                     │                   │ {cart+books}      │
 │                     │                     │                     │                   │──────────────────>│
 │                     │                     │                     │                   │                   │
 │                     │                     │                     │                   │ (create order)    │
 │                     │                     │                     │                   │                   │
 │                     │                     │                     │                   │ DELETE /cart/clear│
 │                     │                     │                     │                   │<──────────────────┤
 │                     │                     │                     │                   │   {cleared}       │
 │                     │                     │                     │                   │──────────────────>│
 │                     │                     │      {order}        │                   │                   │
 │                     │      {order}        │<────────────────────────────────────────────────────────────┤
 │    Order confirmed  │<────────────────────┤                     │                   │                   │
 │<────────────────────┤                     │                     │                   │                   │
 │                     │                     │                     │                   │                   │
```

---

## Key Architectural Patterns

### 1. Service Coupling & Independence

| Pattern                  | Implementation                               | Benefits                              |
| ------------------------ | -------------------------------------------- | ------------------------------------- |
| **Loose Coupling**       | Services communicate via REST APIs           | Services can be updated independently |
| **Database per Service** | Each service has its own MongoDB database    | Data isolation and independence       |
| **Service Discovery**    | Docker network names / environment variables | Dynamic service location              |

### 2. Data Ownership & Consistency

| Service           | Data Owned                       | Data Fetched                   | Strategy                       |
| ----------------- | -------------------------------- | ------------------------------ | ------------------------------ |
| **Book Service**  | Complete book catalog            | None                           | Single source of truth         |
| **Cart Service**  | Cart structure + item references | Book details from Book Service | Reference IDs, fetch on demand |
| **Order Service** | Complete order snapshots         | Cart data (temporary)          | Copy data at creation time     |

**Key Principles:**

- **Book Service is Source of Truth:** Always fetch current book data for display
- **Cart Stores References:** Cart items store book IDs only, enriched on read
- **Orders Snapshot Data:** Orders save complete book details at purchase time (immutable)

### 3. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: API Gateway (Authentication Boundary)              │
│  • Validates JWT tokens                                     │
│  • Extracts user claims (id, email, role)                   │
│  • Injects x-user-* headers                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Backend Services (Trust Layer)                     │
│  • Trust x-user-* headers from gateway                      │
│  • No JWT validation needed                                 │
│  • Use x-user-id for data filtering                         │
└─────────────────────────────────────────────────────────────┘
```

**Authentication Patterns:**

1. **Client → Gateway:** JWT in Cookie (`token=eyJhbGc...`)
2. **Gateway → Service:** User headers (`x-user-id`, `x-user-role`, `x-user-email`)
3. **Service → Service:** Special service tokens (`X-Service-Token`)

### 4. Error Handling & Resilience

**Pattern: Graceful Degradation**

```javascript
// Cart Service handles Book Service failure
try {
  const book = await fetchBookDetails(bookId);
  return { ...item, book };
} catch (error) {
  // Return partial data instead of failing completely
  return { ...item, book: { _id: bookId, title: "Book unavailable" } };
}
```

**Pattern: Request Validation**

```javascript
// Order Service validates before processing
if (!req.user || !req.user.id) {
  return res.status(401).json({ message: "Unauthorized" });
}

const cart = await fetchCart(req.user.id);
if (!cart.items || cart.items.length === 0) {
  return res.status(400).json({ message: "Cart is empty" });
}
```

**Pattern: Service Circuit Breaker**

```javascript
// Handle service unavailability
if (error.code === "ECONNREFUSED") {
  return res.status(503).json({
    message: "Service temporarily unavailable. Please try again later.",
  });
}
```

---

## Real-World Scenarios

### Scenario 1: Price Update Impact

**Situation:** Admin updates book price from $15.99 to $19.99

**Impact:**

1. ✅ **New cart additions:** Show new price ($19.99)
2. ✅ **Existing carts:** Show new price when cart is fetched (Cart Service calls Book Service)
3. ✅ **Checkout:** User pays new price ($19.99)
4. ❌ **Past orders:** Still show old price ($15.99 - immutable snapshot)

### Scenario 2: Book Deletion During Shopping

**Situation:** User has book in cart, admin deletes book

**Flow:**

1. User opens cart
2. Cart Service tries to fetch book from Book Service
3. Book Service returns 404
4. Cart Service returns cart with placeholder: `{ book: { _id: "123", title: "Book not found" } }`
5. User cannot checkout (validation fails)

**Prevention:** Admin should unpublish books instead of deleting

### Scenario 3: Concurrent Order Creation

**Situation:** User submits order twice quickly (double-click)

**Protection:**

1. First request creates order and clears cart
2. Second request fails: "Cart is empty"
3. User sees one order, not two

**Implementation:** Order Service validates cart before creating order

### Scenario 4: Service Downtime

**Book Service Down:**

- Cart operations fail gracefully
- Users see: "Unable to add item. Service unavailable."

**Cart Service Down:**

- Orders cannot be created
- Users see: "Checkout unavailable. Please try again."

**Auth Service Down:**

- All protected routes fail
- Users must wait for service recovery

---

## Performance Considerations

### Optimization Strategies

**1. Cart Enrichment (N+1 Problem)**

```javascript
// ❌ Bad: Sequential calls
for (const item of cartItems) {
  const book = await fetchBookDetails(item.bookId); // Serial requests
}

// ✅ Good: Parallel calls
const bookPromises = cartItems.map((item) => fetchBookDetails(item.bookId));
const books = await Promise.all(bookPromises); // Parallel requests
```

**2. Caching Strategy**

- Book Service: Cache frequently accessed books (Redis)
- Cart Service: Cache book details temporarily (5 minutes)
- Order Service: No caching needed (one-time operation)

**3. Database Indexing**

```javascript
// Cart Service indexes
cartSchema.index({ user: 1 }); // Fast user cart lookup
cartItemSchema.index({ cart: 1 }); // Fast cart items lookup

// Order Service indexes
orderSchema.index({ userId: 1, createdAt: -1 }); // Fast order history
```

---

## Security Best Practices

### 1. JWT Token Security

- **Access Token:** Short-lived (15 minutes), stored in HTTP-only cookie
- **Refresh Token:** Long-lived (7 days), used to get new access tokens
- **Secret Rotation:** JWT secrets rotated periodically

### 2. Service-to-Service Authentication

```javascript
// Order Service → Cart Service (clear cart)
headers: {
  "X-Service-Token": process.env.CART_SERVICE_TOKEN
}

// Cart Service validates
if (req.headers["x-service-token"] !== process.env.CART_SERVICE_TOKEN) {
  return res.status(403).json({ message: "Forbidden" });
}
```

### 3. Input Validation

- All services validate request bodies
- Sanitize user inputs to prevent injection
- Validate user IDs match authenticated user

### 4. CORS Configuration

```javascript
// API Gateway allows only frontend origin
cors({
  origin: process.env.FRONTEND_URL || "http://localhost:4200",
  credentials: true,
});
```

---

## Monitoring & Logging

### Log Patterns

**Request Tracing:**

```javascript
// Each service logs with request ID
console.log(`[${requestId}] Cart fetch for user ${userId}`);
console.log(`[${requestId}] Calling Book Service for book ${bookId}`);
```

**Service Health Checks:**

```javascript
// Each service exposes /health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "cart-service" });
});
```

**Error Logging:**

```javascript
// Structured error logs
console.error({
  error: err.message,
  stack: err.stack,
  userId: req.user?.id,
  endpoint: req.path,
  timestamp: new Date().toISOString(),
});
```

---

## Future Enhancements

### Potential Improvements

1. **Event-Driven Architecture**

   - Use message queue (RabbitMQ/Kafka) for async operations
   - Example: Order created → Clear cart event → Email notification event

2. **GraphQL Gateway**

   - Replace REST gateway with GraphQL
   - Frontend can request exactly what it needs
   - Reduces over-fetching

3. **Service Mesh**

   - Implement Istio or Linkerd
   - Better service-to-service security
   - Advanced traffic management

4. **Distributed Tracing**

   - Implement Jaeger or Zipkin
   - Track requests across all services
   - Performance bottleneck identification

5. **API Versioning**
   - Support multiple API versions
   - Example: `/v1/books`, `/v2/books`
   - Smooth migration path

---

## Conclusion

BookVerse demonstrates a well-architected microservices system with clear separation of concerns, robust error handling, and scalable design patterns. The system successfully balances:

- **Simplicity:** Each service has a single, clear responsibility
- **Scalability:** Services can be scaled independently based on load
- **Maintainability:** Clear APIs and documented interactions
- **Security:** Layered authentication and authorization
- **Resilience:** Graceful degradation when dependencies fail

### Microservice Interaction Summary

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ All requests
       ▼
┌─────────────┐
│ API Gateway │ ◄── Single entry point
└──┬──┬──┬──┬─┘
   │  │  │  └────────────┐
   ▼  ▼  ▼               ▼
┌────┐┌────┐┌────┐    ┌─────┐
│Auth││Book││Cart│    │Order│
└────┘└─▲──┘└─▲──┘    └──▲──┘
         │     │          │
         │     └──────────┤ Service-to-service
         └────────────────┘ communication
```

**For more details:**

- See `README.md` for setup instructions
- See `STRUCTURE.md` for project structure
- See individual service README files for API documentation

---

_Last updated: December 1, 2025_
_Documentation maintained by: BookVerse Development Team_
