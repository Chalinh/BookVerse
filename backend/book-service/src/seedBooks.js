import mongoose from "mongoose";
import dotenv from "dotenv";
import Book from "./models/book.model.js";

dotenv.config();

const demoBooks = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 14.99,
    category: "Classic",
    description: "A gripping tale of racial injustice and childhood innocence.",
    publication_year: 1960,
    image_url: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 12.99,
    category: "Classic",
    description:
      "A story of wealth, love, and the American Dream in the 1920s.",
    publication_year: 1925,
    image_url: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
  },
  {
    title: "Murder on the Orient Express",
    author: "Agatha Christie",
    price: 13.99,
    category: "Mystery",
    description:
      "Detective Hercule Poirot solves a murder aboard a luxurious train.",
    publication_year: 1934,
    image_url: "https://covers.openlibrary.org/b/id/8739161-L.jpg",
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    price: 16.99,
    category: "Fantasy",
    description:
      "A young wizard discovers his magical heritage and attends Hogwarts.",
    publication_year: 1997,
    image_url: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 11.99,
    category: "Romance",
    description:
      "A witty exploration of love, marriage, and societal expectations.",
    publication_year: 1813,
    image_url: "https://covers.openlibrary.org/b/id/8235657-L.jpg",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    price: 15.99,
    category: "Fantasy",
    description:
      "Bilbo Baggins embarks on an unexpected adventure with dwarves and a wizard.",
    publication_year: 1937,
    image_url: "https://covers.openlibrary.org/b/id/8566742-L.jpg",
  },
  {
    title: "1984",
    author: "George Orwell",
    price: 13.49,
    category: "Fiction",
    description:
      "A dystopian novel about surveillance, totalitarianism, and individual freedom.",
    publication_year: 1949,
    image_url: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    price: 14.49,
    category: "Mystery",
    description:
      "A journalist and hacker investigate a decades-old disappearance.",
    publication_year: 2005,
    image_url: "https://covers.openlibrary.org/b/id/8231279-L.jpg",
  },
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    price: 15.49,
    category: "Fantasy",
    description:
      "A magical competition between two young illusionists set in a mysterious circus.",
    publication_year: 2011,
    image_url: "https://covers.openlibrary.org/b/id/8231329-L.jpg",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB");

    // Clear existing books
    await Book.deleteMany({});
    console.log("Cleared existing books");

    // Insert demo books
    await Book.insertMany(demoBooks);
    console.log(`Successfully seeded ${demoBooks.length} books`);

    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
