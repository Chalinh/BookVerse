import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css'],
})
export class Payment implements OnInit {
  name = '';
  shippingAddress = '';
  cardNumber = '';
  expiredDate = '';
  CVV = '';
  orderNote = '';

  showSuccessModal = signal(false);
  isProcessing = signal(false);
  // Preserve the total at pay time so modal doesn't show 0 after cart clear
  paymentTotal = 0;

  private cart = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  ngOnInit() {
    // Sync cart with backend on page load
    console.log('[Payment] Syncing cart with backend on page load');
    this.cart.fetchCart();
  }

  get items() {
    return this.cart.items();
  }

  getTotal() {
    return this.cart.getTotal();
  }

  pay() {
    // Validate required fields
    if (
      !this.name ||
      !this.shippingAddress ||
      !this.cardNumber ||
      !this.CVV ||
      !this.expiredDate
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (this.cart.items().length === 0) {
      alert('Your cart is empty.');
      return;
    }

    // Capture total before any async/clear operation
    this.paymentTotal = this.getTotal();
    this.isProcessing.set(true);

    const orderData = {
      name: this.name,
      shippingAddress: this.shippingAddress,
      cardNumber: this.cardNumber,
      CVV: this.CVV,
      expiredDate: this.expiredDate,
      orderNote: this.orderNote,
    };

    console.log('[Payment] Creating order with data:', orderData);

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('[Payment] Order created successfully:', response);
        this.isProcessing.set(false);
        this.showSuccessModal.set(true);

        // Clear cart after successful order
        this.cart.clear();

        // Redirect to profile after 3 seconds
        setTimeout(() => {
          this.showSuccessModal.set(false);
          this.router.navigate(['/profile']);
        }, 3000);
      },
      error: (err) => {
        console.error('[Payment] Order creation failed:', err);
        this.isProcessing.set(false);
        alert(
          'Payment failed. Please try again. ' + (err.error?.message || '')
        );
      },
    });
  }

  closeModal() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/profile']);
  }
}
