import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homescreen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homescreen.html',
  styleUrls: ['./homescreen.css'],
})
export class Homescreen {
  categories = ['All', 'Fiction', 'Classic', 'Mystery', 'Fantasy', 'Romance'];
  books = [
    { title: 'Dune', author: 'Frank Herbert', price: 13 },
    { title: 'Harry Potter', author: 'J.K. Rowling', price: 14 },
    { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', price: 15 },
  ];
}
