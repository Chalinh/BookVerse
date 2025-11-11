import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css'],
})
export class Payment {
  name = '';
  address = '';
  cardNumber = '';
  exp = '';
  cvv = '';
  notes = '';

  private cart = inject(CartService);

  get items() {
    return this.cart.items();
  }

  getTotal() {
    return this.cart.getTotal();
  }

  pay() {
    // small demo handler — replace with real payment integration
    alert(
      `Processing payment of $${this.getTotal()} for ${this.name || 'guest'}`
    );
    // clear cart after demo payment
    this.cart.clear();
  }
}
