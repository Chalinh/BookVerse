import Book from "../models/book.model.js";

export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().lean();
    // Map category to genre for frontend compatibility
    const booksWithGenre = books.map((book) => ({
      _id: book._id.toString(), // Convert ObjectId to string
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.category,
      category: book.category,
      description: book.description,
      coverImage: book.image_url,
      publication_year: book.publication_year,
    }));
    res.json(booksWithGenre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchBooks = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
      ],
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    let { category } = req.query;

    if (!category || category.trim() === "") {
      return res.status(400).json({ message: "Category is required" });
    }

    category = category.trim();

    const books = await Book.find({
      category: { $regex: category, $options: "i" },
    });

    if (books.length === 0) {
      return res
        .status(404)
        .json({ message: "No books found for this category" });
    }

    res.json(books);
  } catch (error) {
    console.error("getBooksByCategory error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBookDetail = async (req, res) => {
  try {
    let id = req.params.id;
    id = id.trim();
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      price,
      category,
      description,
      image_url,
      publication_year,
    } = req.body;

    if (!title || !author || !price || !category) {
      return res.status(400).json({
        message: "Title, author, price, and category are required",
      });
    }

    const book = new Book({
      title,
      author,
      price,
      category,
      description,
      image_url,
      publication_year,
    });

    await book.save();

    // Map to frontend format
    const bookResponse = {
      _id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.category,
      category: book.category,
      description: book.description,
      coverImage: book.image_url,
      publication_year: book.publication_year,
    };

    res.status(201).json(bookResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const book = await Book.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Map to frontend format
    const bookResponse = {
      _id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.category,
      category: book.category,
      description: book.description,
      coverImage: book.image_url,
      publication_year: book.publication_year,
    };

    res.json(bookResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully", book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
