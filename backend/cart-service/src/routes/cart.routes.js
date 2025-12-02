import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getCart,
  addToCart,
  removeOneFromCart,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import serviceAuthMiddleware from "../middleware/service.middleware.js";

const router = express.Router();

// Get user cart
router.get("/cart", authMiddleware, getCart);

// Add item to cart
router.post("/cart/add", authMiddleware, addToCart);

// Remove one item from cart
router.post("/cart/remove", authMiddleware, removeOneFromCart);

// Remove cart item completely
router.delete("/cart/item/:itemId", authMiddleware, removeCartItem);
router.delete("/cart/clear", serviceAuthMiddleware, clearCart);

export default router;
