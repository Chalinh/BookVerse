import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  title: string;
  author?: string;
  genre?: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  readonly items = computed(() => this._items());

  add(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const existing = this._items().find(
      (i) => i.title === item.title && i.price === item.price
    );
    if (existing) {
      this._items.update((list) =>
        list.map((i) =>
          i === existing
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      );
    } else {
      const toAdd: CartItem = {
        ...item,
        quantity: item.quantity ?? 1,
      } as CartItem;
      this._items.update((list) => [...list, toAdd]);
    }
  }

  remove(item: CartItem) {
    this._items.update((list) => list.filter((i) => i !== item));
  }

  increase(item: CartItem) {
    this._items.update((list) =>
      list.map((i) => (i === item ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }

  decrease(item: CartItem) {
    this._items.update((list) =>
      list.map((i) =>
        i === item ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
      )
    );
  }

  clear() {
    this._items.set([]);
  }

  getTotal() {
    return this._items().reduce((acc, it) => acc + it.price * it.quantity, 0);
  }
}
