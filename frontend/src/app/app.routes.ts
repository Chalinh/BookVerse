import { Routes } from '@angular/router';
import { Homescreen } from './homescreen/homescreen';
import { Cart } from './cart/cart';
import { About } from './about/about';
export const routes: Routes = [
    { path: 'home', component: Homescreen },
    { path: 'cart', component: Cart },
    { path: 'about', component: About }
];

