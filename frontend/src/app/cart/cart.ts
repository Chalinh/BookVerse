import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  cartItems = [
    {
      title: 'Book One',
      author: 'Author A',
      genre: 'Fiction',
      price: 16,
      quantity: 1,
    },
    {
      title: 'Book Two',
      author: 'Author B',
      genre: 'Mystery',
      price: 20,
      quantity: 2,
    },
  ];

  increaseQuantity(item: any) {
    item.quantity++;
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) item.quantity--;
  }

  removeItem(item: any) {
    this.cartItems = this.cartItems.filter((i) => i !== item);
  }

  getTotal() {
    return this.cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }

  checkout() {
    alert('Proceeding to checkout...');
  }
}
