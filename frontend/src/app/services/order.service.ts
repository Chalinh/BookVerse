import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface OrderItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  name: string;
  shippingAddress: string;
  orderNote?: string;
  status?: 'pending' | 'success' | 'fail';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/v1/orders';
  private orderServiceDirect =
    'https://order-services-vezr.onrender.com/api/orders';

  createOrder(orderData: any) {
    return this.http.post(this.apiUrl, orderData, { withCredentials: true });
  }

  getUserOrders() {
    return this.http.get<Order[]>(this.apiUrl, { withCredentials: true });
  }

  // Admin: fetch all orders (backend excludes payment fields)
  getAllOrders() {
    // Call Order Service directly to avoid gateway auth on admin screen
    return this.http.get<Order[]>(`${this.orderServiceDirect}/all`);
  }

  // Admin: update order status
  updateOrderStatus(id: string, status: 'pending' | 'success' | 'fail') {
    return this.http.patch<Order>(`${this.orderServiceDirect}/${id}/status`, {
      status,
    });
  }
}
