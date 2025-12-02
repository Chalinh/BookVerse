import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, of } from 'rxjs';

export interface CartItem {
  _id?: string;
  title: string;
  author?: string;
  genre?: string;
  price: number;
  quantity: number;
  bookId?: string;
  coverImage?: string;
}

interface BackendCartItem {
  _id: string;
  quantity: number;
  price: number;
  book: {
    _id: string;
    title: string;
    author: string;
    category: string;
    price: number;
    coverImage?: string;
    image_url?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/v1'; // API Gateway base URL
  private _items = signal<CartItem[]>([]);
  private useBackend = signal<boolean>(false); // Flag to enable backend sync

  readonly items = computed(() => this._items());

  // Enable backend sync (called after successful auth)
  enableBackend() {
    this.useBackend.set(true);
  }

  // Fetch cart from backend and sync with local items (requires auth)
  fetchCart() {
    console.log('[CartService] Fetching cart from backend...');
    const currentLocalItems = this._items();
    console.log('[CartService] Current local items:', currentLocalItems);

    this.http
      .get<{ cartId: string; items: BackendCartItem[] }>(
        `${this.apiUrl}/cart`,
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          console.log('[CartService] Backend cart response:', response);
          return response.items.map((item) => ({
            _id: item._id,
            title: item.book.title,
            author: item.book.author,
            genre: item.book.category,
            price: item.book.price,
            quantity: item.quantity,
            bookId: item.book._id,
            coverImage:
              (item.book as any).coverImage || (item.book as any).image_url,
          }));
        }),
        catchError((err) => {
          console.error(
            '[CartService] Failed to fetch cart from backend:',
            err
          );
          this.useBackend.set(false);
          return of([]);
        })
      )
      .subscribe((backendItems) => {
        console.log('[CartService] Fetched backend items:', backendItems);
        this.useBackend.set(true);

        // If backend is empty but we have local items, sync local to backend
        if (backendItems.length === 0 && currentLocalItems.length > 0) {
          console.log(
            '[CartService] Backend empty, syncing local items to backend...'
          );
          this.syncLocalItemsToBackend(currentLocalItems);
        } else {
          // Backend has items, use those
          this._items.set(backendItems);
        }
      });
  }

  // Sync local cart items to backend
  private syncLocalItemsToBackend(localItems: CartItem[]) {
    console.log('[CartService] Syncing local items to backend:', localItems);

    // Add each local item to backend one by one
    let syncedCount = 0;
    localItems.forEach((item, index) => {
      if (item.bookId) {
        // Add the item with its quantity
        for (let i = 0; i < item.quantity; i++) {
          this.http
            .post<{ cartId: string; items: BackendCartItem[] }>(
              `${this.apiUrl}/cart/add`,
              { bookId: item.bookId },
              { withCredentials: true }
            )
            .pipe(
              map((response) =>
                response.items.map((i) => ({
                  _id: i._id,
                  title: i.book.title,
                  author: i.book.author,
                  genre: i.book.category,
                  price: i.book.price,
                  quantity: i.quantity,
                  bookId: i.book._id,
                  coverImage:
                    (i.book as any).coverImage || (i.book as any).image_url,
                }))
              ),
              catchError((err) => {
                console.error('[CartService] Failed to sync item:', item, err);
                return of(null);
              })
            )
            .subscribe((items) => {
              syncedCount++;
              // Update local state with backend response after last item
              if (
                syncedCount ===
                localItems.reduce((sum, it) => sum + it.quantity, 0)
              ) {
                if (items) {
                  console.log(
                    '[CartService] All items synced, updating state:',
                    items
                  );
                  this._items.set(items);
                }
              }
            });
        }
      }
    });

    // If no items had bookId, keep local items
    if (localItems.every((item) => !item.bookId)) {
      console.log('[CartService] No items with bookId, keeping local state');
    }
  }

  add(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    console.log(
      '[CartService] Adding item:',
      item,
      'useBackend:',
      this.useBackend()
    );
    if (this.useBackend() && item.bookId) {
      // Use backend
      console.log('[CartService] Adding to backend cart...');
      this.http
        .post<{ cartId: string; items: BackendCartItem[] }>(
          `${this.apiUrl}/cart/add`,
          { bookId: item.bookId },
          { withCredentials: true }
        )
        .pipe(
          map((response) => {
            console.log('[CartService] Backend add response:', response);
            return response.items.map((i) => ({
              _id: i._id,
              title: i.book.title,
              author: i.book.author,
              genre: i.book.category,
              price: i.book.price,
              quantity: i.quantity,
              bookId: i.book._id,
              coverImage:
                (i.book as any).coverImage || (i.book as any).image_url,
            }));
          }),
          catchError((err) => {
            console.error('[CartService] Backend add failed:', err);
            console.error('[CartService] Error details:', err.error);
            // Don't disable backend mode, just add locally as fallback
            return of(null);
          })
        )
        .subscribe((items) => {
          if (items) {
            console.log('[CartService] Cart updated with items:', items);
            this._items.set(items);
          } else {
            console.warn(
              '[CartService] Backend add failed, adding to local cart as fallback'
            );
            this.addLocal(item);
          }
        });
    } else {
      console.log(
        '[CartService] Adding to local cart (backend not enabled or no bookId)'
      );
      this.addLocal(item);
    }
  }

  private addLocal(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
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
    if (this.useBackend() && item._id) {
      this.http
        .delete(`${this.apiUrl}/cart/item/${item._id}`, {
          withCredentials: true,
        })
        .pipe(
          catchError((err) => {
            console.warn('Backend remove failed, using local cart:', err);
            this.useBackend.set(false);
            return of(null);
          })
        )
        .subscribe(() => {
          this._items.update((list) => list.filter((i) => i !== item));
        });
    } else {
      this._items.update((list) => list.filter((i) => i !== item));
    }
  }

  increase(item: CartItem) {
    if (this.useBackend() && item.bookId) {
      this.http
        .post<{ cartId: string; items: BackendCartItem[] }>(
          `${this.apiUrl}/cart/add`,
          { bookId: item.bookId },
          { withCredentials: true }
        )
        .pipe(
          map((response) =>
            response.items.map((i) => ({
              _id: i._id,
              title: i.book.title,
              author: i.book.author,
              genre: i.book.category,
              price: i.book.price,
              quantity: i.quantity,
              bookId: i.book._id,
              coverImage:
                (i.book as any).coverImage || (i.book as any).image_url,
            }))
          ),
          catchError(() => of(null))
        )
        .subscribe((items) => {
          if (items) {
            this._items.set(items);
          } else {
            this.increaseLocal(item);
          }
        });
    } else {
      this.increaseLocal(item);
    }
  }

  private increaseLocal(item: CartItem) {
    this._items.update((list) =>
      list.map((i) => (i === item ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }

  decrease(item: CartItem) {
    if (this.useBackend() && item.bookId) {
      this.http
        .post<{ cartId: string; items: BackendCartItem[] }>(
          `${this.apiUrl}/cart/remove`,
          { bookId: item.bookId },
          { withCredentials: true }
        )
        .pipe(
          map((response) =>
            response.items.map((i) => ({
              _id: i._id,
              title: i.book.title,
              author: i.book.author,
              genre: i.book.category,
              price: i.book.price,
              quantity: i.quantity,
              bookId: i.book._id,
              coverImage:
                (i.book as any).coverImage || (i.book as any).image_url,
            }))
          ),
          catchError(() => of(null))
        )
        .subscribe((items) => {
          if (items) {
            this._items.set(items);
          } else {
            this.decreaseLocal(item);
          }
        });
    } else {
      this.decreaseLocal(item);
    }
  }

  private decreaseLocal(item: CartItem) {
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
