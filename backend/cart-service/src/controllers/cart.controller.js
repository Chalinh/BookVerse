import Cart from "../models/cart.model.js";
import CartItem from "../models/cartItem.model.js";
import axios from "axios";

// Book service URL for fetching book details
const BOOK_SERVICE_URL =
  process.env.BOOK_SERVICE_URL || "http://localhost:3004/api/books";

// Fetch book details from book service
const fetchBookDetails = async (bookId) => {
  try {
    const response = await axios.get(
      `${BOOK_SERVICE_URL.replace(/\/+$/, "")}/${bookId}`
    );
    return response.data;
  } catch (err) {
    console.warn(`Book not found: ${bookId}`);
    return null;
  }
};

// Get cart details with populated books
const getCartDetails = async (cartId) => {
  const items = await CartItem.find({ cart: cartId });
  return await Promise.all(
    items.map(async (i) => {
      const book = await fetchBookDetails(i.book);
      return {
        _id: i._id,
        quantity: i.quantity,
        price: book ? book.price * i.quantity : 0,
        book: book || { _id: i.book, title: "Book not found" },
      };
    })
  );
};

// Get user cart
export const getCart = async (req, res) => {
  console.log("[Cart Controller] Get cart request:", {
    userId: req.user?.id,
    userFromHeaders: {
      id: req.header("x-user-id"),
      role: req.header("x-user-role"),
      email: req.header("x-user-email"),
    },
  });

  try {
    if (!req.user || !req.user.id) {
      console.warn("[Cart Controller] User not authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    console.log("[Cart Controller] Found cart:", cart);

    if (!cart) {
      console.log("[Cart Controller] No cart found, returning empty");
      return res.json({ items: [] });
    }

    const detailedItems = await getCartDetails(cart._id);
    console.log(
      "[Cart Controller] Returning cart with items:",
      detailedItems.length
    );
    res.json({ cartId: cart._id, items: detailedItems });
  } catch (err) {
    console.error("[Cart Controller] Error getting cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  const { bookId } = req.body;
  console.log("[Cart Controller] Add to cart request:", {
    bookId,
    userId: req.user?.id,
    userFromHeaders: {
      id: req.header("x-user-id"),
      role: req.header("x-user-role"),
      email: req.header("x-user-email"),
    },
  });

  try {
    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const book = await fetchBookDetails(bookId);
    if (!book) return res.status(404).json({ message: "Book does not exist" });

    let cart = await Cart.findOne({ user: req.user.id });
    console.log("[Cart Controller] Found cart:", cart);
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
      console.log("[Cart Controller] Created new cart:", cart);
    }

    let item = await CartItem.findOne({ cart: cart._id, book: bookId });
    console.log("[Cart Controller] Found cart item:", item);
    if (item) {
      item.quantity += 1;
      await item.save();
      console.log(
        "[Cart Controller] Updated cart item quantity:",
        item.quantity
      );
    } else {
      item = await CartItem.create({
        cart: cart._id,
        book: bookId,
        quantity: 1,
      });
      console.log("[Cart Controller] Created new cart item:", item);
    }

    const detailedItems = await getCartDetails(cart._id);
    console.log(
      "[Cart Controller] Returning cart with items:",
      detailedItems.length
    );
    res.json({ cartId: cart._id, items: detailedItems });
  } catch (err) {
    console.error("[Cart Controller] Error adding to cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Remove one item from cart
export const removeOneFromCart = async (req, res) => {
  const { bookId } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = await CartItem.findOne({ cart: cart._id, book: bookId });
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    item.quantity -= 1;
    if (item.quantity <= 0) {
      await item.remove();
    } else {
      await item.save();
    }

    const detailedItems = await getCartDetails(cart._id);
    res.json({ cartId: cart._id, items: detailedItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove cart item by ID
export const removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const item = await CartItem.findByIdAndDelete(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const items = await CartItem.find({ cart: item.cart });
    const detailedItems = await Promise.all(
      items.map(async (i) => {
        const book = await fetchBookDetails(i.book);
        return {
          _id: i._id,
          quantity: i.quantity,
          price: book ? book.price * i.quantity : 0,
          book: book || { _id: i.book, title: "Book not found" },
        };
      })
    );

    res.json({ cartId: item.cart, items: detailedItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear cart - only callable by order-service with valid service token
export const clearCart = async (req, res) => {
  try {
    const token = req.header("X-Service-Token");
    if (!token || token !== process.env.CART_SERVICE_TOKEN) {
      return res
        .status(403)
        .json({ message: "Forbidden: invalid service token" });
    }

    const { userId } = req.body;
    if (!userId)
      return res
        .status(400)
        .json({ message: "userId is required to clear cart" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await CartItem.deleteMany({ cart: cart._id });

    res.json({ message: "Cart cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
