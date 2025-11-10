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
    { title: 'Dune', author: 'Frank Herbert', price: 13, genre: 'Classic' },
    { title: 'Harry Potter', author: 'J.K. Rowling', price: 14, genre: 'Fiction' },
    { title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', price: 15, genre: 'Romance' },
    { title: 'The Avenger', author: 'Stanlee', price: 20, genre: 'Fiction' },
  ];
}
