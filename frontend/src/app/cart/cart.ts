import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  cart = inject(CartService);
  private router = inject(Router);

  increaseQuantity(item: any) {
    this.cart.increase(item);
  }

  decreaseQuantity(item: any) {
    this.cart.decrease(item);
  }

  removeItem(item: any) {
    this.cart.remove(item);
  }

  getTotal() {
    return this.cart.getTotal();
  }

  checkout() {
    this.router.navigate(['/payment']);
  }
}
