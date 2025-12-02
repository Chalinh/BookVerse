import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { BookService } from '../services/book.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PopupService } from '../shared/popup.service';

@Component({
  selector: 'app-homescreen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homescreen.html',
  styleUrls: ['./homescreen.css'],
})
export class Homescreen {
  private cart = inject(CartService);
  bookService = inject(BookService); // Make public for template access
  private router = inject(Router);
  private popup = inject(PopupService);

  // toast UI state for add-to-cart confirmation
  toastVisible = false;
  toastMessage = '';

  categories = ['All', 'Fiction', 'Classic', 'Mystery', 'Fantasy', 'Romance'];
  selectedCategory = 'All';

  get books() {
    const allBooks = this.bookService.books();
    const searchQuery = this.bookService.searchQuery().toLowerCase().trim();

    let filtered = allBooks;

    // Filter by category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        (book) => book.genre === this.selectedCategory
      );
    }

    // Filter by search query (search in title, author, and genre)
    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery) ||
          book.author.toLowerCase().includes(searchQuery) ||
          book.genre.toLowerCase().includes(searchQuery)
      );
    }

    return filtered;
  }

  constructor() {
    this.bookService.fetchBooks();
  }

  addToCart(book: any) {
    const authed = localStorage.getItem('isAuthenticated') === 'true';
    if (!authed) {
      this.popup.show('Please log in to add items to your cart.', {
        type: 'error',
        durationMs: 2500,
      });
      // Stay on page; user can click Login from navbar
      return;
    }
    this.cart.add({
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.genre,
      bookId: book._id,
      coverImage: book.coverImage,
    });
    this.showToast(`${book.title} added to cart`);
  }

  purchase(book: any) {
    const authed = localStorage.getItem('isAuthenticated') === 'true';
    if (!authed) {
      this.popup.show('Please log in before purchasing.', {
        type: 'error',
        durationMs: 2500,
      });
      return;
    }
    // add the single item and navigate to payment
    this.cart.add({
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.genre,
      bookId: book._id, // Pass book ID for backend sync
      coverImage: book.coverImage, // Pass cover image URL
      quantity: 1,
    });
    // navigate to payment screen
    this.router.navigate(['/payment']);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  clearSearch() {
    console.log('[Homescreen] Clearing search');
    this.bookService.clearSearch();
  }

  private showToast(msg: string, ms = 1800) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), ms);
  }
}
