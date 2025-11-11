import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homescreen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homescreen.html',
  styleUrls: ['./homescreen.css'],
})
export class Homescreen {
  private cart = inject(CartService);
  private router = inject(Router);

  // toast UI state for add-to-cart confirmation
  toastVisible = false;
  toastMessage = '';

  categories = ['All', 'Fiction', 'Classic', 'Mystery', 'Fantasy', 'Romance'];
  books = [
    { title: 'Dune', author: 'Frank Herbert', price: 13, genre: 'Classic' },
    {
      title: 'Harry Potter',
      author: 'J.K. Rowling',
      price: 14,
      genre: 'Fiction',
    },
    {
      title: 'Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      price: 15,
      genre: 'Romance',
    },
    { title: 'The Avenger', author: 'Stanlee', price: 20, genre: 'Fiction' },
    { title: 'DC', author: 'random dudue', price: 69, genre: 'Lerb' },
  ];

  addToCart(book: any) {
    this.cart.add({
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.genre,
    });
    this.showToast(`${book.title} added to cart`);
  }

  purchase(book: any) {
    // add the single item and navigate to payment
    this.cart.add({
      title: book.title,
      author: book.author,
      price: book.price,
      genre: book.genre,
      quantity: 1,
    });
    // navigate to payment screen
    this.router.navigate(['/payment']);
  }

  private showToast(msg: string, ms = 1800) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), ms);
  }
}
