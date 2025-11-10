import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { LucideAngularModule, ShoppingCart, BookAIcon } from 'lucide-angular';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, RouterLinkWithHref],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('frontend');
  readonly ShoppingCart = ShoppingCart;
  readonly Book = BookAIcon;
}
