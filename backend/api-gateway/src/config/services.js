// Service registry - maps service names to their Docker network URLs and metadata
const services = {
  auth: {
    name: "auth-service",
    url: process.env.AUTH_SERVICE_URL || "http://localhost:5000",
    healthCheck: "/health",
    requiresAuth: false,
    description: "Authentication and user management service",
  },
  books: {
    name: "book-service",
    url: process.env.BOOK_SERVICE_URL || "http://localhost:3004",
    healthCheck: "/health",
    requiresAuth: false,
    description: "Book catalog and management service",
  },
  cart: {
    name: "cart-service",
    url: process.env.CART_SERVICE_URL || "http://localhost:3001",
    healthCheck: "/health",
    requiresAuth: true,
    description: "Shopping cart service",
  },
  orders: {
    name: "order-service",
    url: process.env.ORDER_SERVICE_URL || "http://localhost:3002",
    healthCheck: "/health",
    requiresAuth: true,
    description: "Order processing and management service",
  },
};

// Route mappings from gateway paths to services
export const routeConfig = [
  {
    path: "/v1/auth",
    service: services.auth,
    requiresAuth: false,
    description: "Authentication endpoints (login, register, etc.)",
  },
  {
    path: "/v1/user",
    service: services.auth,
    requiresAuth: true,
    description: "User profile management endpoints",
  },
  {
    path: "/v1/books",
    service: services.books,
    requiresAuth: false,
    description: "Book catalog endpoints",
  },
  {
    path: "/v1/cart",
    service: services.cart,
    requiresAuth: true,
    description: "Shopping cart endpoints",
  },
  {
    path: "/v1/orders",
    service: services.orders,
    requiresAuth: true,
    description: "Order management endpoints",
  },
];

// Get service by name
export const getService = (name) => {
  return services[name];
};

// Get all services
export const getAllServices = () => {
  return services;
};

// Check if a route requires authentication
export const requiresAuthentication = (path) => {
  const route = routeConfig.find((r) => path.startsWith(r.path));
  return route ? route.requiresAuth : false;
};

export default services;
