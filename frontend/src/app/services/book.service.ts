import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

export interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  genre: string;
  description?: string;
  coverImage?: string;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/v1/books'; 

  books = signal<Book[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');

  fetchBooks() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Book[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('Books fetched from backend:', data);
        this.books.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch books from backend:', err);
        this.error.set(
          'Failed to load books. Please make sure the backend is running.'
        );
        this.loading.set(false);
      },
    });
  }

  addBook(book: Omit<Book, '_id'>) {
    return this.http.post<Book>(this.apiUrl, book).pipe(
      map((newBook) => {
        // Update the signal with the new book
        this.books.update((books) => [...books, newBook]);
        return newBook;
      })
    );
  }

  updateBook(id: string, updates: Partial<Book>) {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, updates).pipe(
      map((updatedBook) => {
        // Update the signal with the modified book
        this.books.update((books) =>
          books.map((book) => (book._id === id ? updatedBook : book))
        );
        return updatedBook;
      })
    );
  }

  deleteBook(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        // Remove the book from the signal
        this.books.update((books) => books.filter((book) => book._id !== id));
        return id;
      })
    );
  }

  setSearchQuery(query: string) {
    console.log('[BookService] Setting search query:', query);
    this.searchQuery.set(query);
  }

  clearSearch() {
    this.searchQuery.set('');
  }
}
