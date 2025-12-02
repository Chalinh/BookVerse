import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router } from '@angular/router';
import {
  LucideAngularModule,
  ShoppingCart,
  BookAIcon,
  Search,
  LogOut,
  User,
} from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { BookService } from './services/book.service';
import { PopupComponent } from './shared/popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LucideAngularModule,
    RouterLinkWithHref,
    CommonModule,
    FormsModule,
    PopupComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private bookService = inject(BookService);
  private router = inject(Router);

  protected readonly title = signal('frontend');
  readonly ShoppingCart = ShoppingCart;
  readonly Book = BookAIcon;
  readonly Search = Search;
  readonly LogOut = LogOut;
  readonly User = User;
  // auth / modal state
  LoginOpen = false;
  isAuthenticated = signal(false);
  authError = '';
  // Login form bindings
  loginEmail = '';
  loginPassword = '';
  // Auth tab state
  authTab: 'login' | 'signup' = 'login';
  // Signup form bindings
  signupName = '';
  signupEmail = '';
  signupPassword = '';
  signupConfirm = '';
  menuOpen = false;
  searchOpen = false;
  searchQuery = '';

  constructor() {
    // Try to restore session on app load
    this.checkAuth();

    // Enable backend immediately if user was previously authenticated
    const wasAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (wasAuthenticated) {
      console.log('[App] Enabling backend cart mode on app start');
      this.cartService.enableBackend();
    }
  }

  // Hide store shell (navbar/footer/modals) on admin routes
  isAdminRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/admin') || url.startsWith('/admin-login');
  }

  private checkAuth() {
    console.log('[App] Checking authentication on app load...');

    // Check if we have a stored auth state
    const wasAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    console.log(
      '[App] Previous auth state from localStorage:',
      wasAuthenticated
    );

    if (!wasAuthenticated) {
      console.log('[App] No previous session found, skipping refresh');
      this.isAuthenticated.set(false);
      return;
    }

    this.authService.refresh().subscribe({
      next: (response) => {
        console.log(
          '[App] Authentication successful, restoring session',
          response
        );
        this.isAuthenticated.set(true);
        localStorage.setItem('isAuthenticated', 'true');
        this.cartService.enableBackend();
        this.cartService.fetchCart();
      },
      error: (err) => {
        console.log('[App] Authentication refresh failed:', err);
        console.log('[App] Error details:', err.error);
        this.isAuthenticated.set(false);
        localStorage.removeItem('isAuthenticated');
      },
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
      // Clear search in book service when closing search bar
      this.bookService.clearSearch();
    }
  }

  onSearch() {
    const query = this.searchQuery.trim();
    console.log('[App] Searching for:', query);

    // Set search query in book service
    this.bookService.setSearchQuery(query);

    // Navigate to home page to show results
    this.router.navigate(['/home']);

    // Close search bar
    this.searchOpen = false;
  }

  toggleLogin() {
    this.LoginOpen = !this.LoginOpen;
  }

  setAuthTab(tab: 'login' | 'signup') {
    this.authTab = tab;
  }

  onLogin() {
    this.authError = '';
    console.log('[App] Attempting login...');
    this.authService
      .login({
        email: this.loginEmail,
        password: this.loginPassword,
      })
      .subscribe({
        next: (response) => {
          console.log('[App] Login successful:', response);
          this.isAuthenticated.set(true);
          localStorage.setItem('isAuthenticated', 'true');
          this.cartService.enableBackend();
          this.cartService.fetchCart();
          this.LoginOpen = false;
          this.loginEmail = '';
          this.loginPassword = '';
        },
        error: (err) => {
          console.error('[App] Login failed:', err);
          this.authError =
            err.error?.message || 'Login failed. Please try again.';
        },
      });
  }

  onSignup() {
    this.authError = '';
    if (this.signupPassword !== this.signupConfirm) {
      this.authError = 'Passwords do not match';
      return;
    }
    console.log('[App] Attempting signup...');
    this.authService
      .signup({
        username: this.signupName,
        email: this.signupEmail,
        password: this.signupPassword,
      })
      .subscribe({
        next: (response) => {
          console.log('[App] Signup successful:', response);
          this.isAuthenticated.set(true);
          localStorage.setItem('isAuthenticated', 'true');
          this.cartService.enableBackend();
          this.cartService.fetchCart();
          this.LoginOpen = false;
          this.signupName = '';
          this.signupEmail = '';
          this.signupPassword = '';
          this.signupConfirm = '';
        },
        error: (err) => {
          console.error('[App] Signup failed:', err);
          this.authError =
            err.error?.message || 'Signup failed. Please try again.';
        },
      });
  }

  onLogout() {
    console.log('[App] Logging out...');
    this.authService.logout().subscribe({
      next: () => {
        console.log('[App] Logout successful');
        this.isAuthenticated.set(false);
        localStorage.removeItem('isAuthenticated');
        this.cartService.clear();
      },
      error: (err) => {
        console.error('[App] Logout failed:', err);
        // Still clear local state even if server logout fails
        this.isAuthenticated.set(false);
        localStorage.removeItem('isAuthenticated');
        this.cartService.clear();
      },
    });
  }
}
