import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CommonModule, CurrencyPipe],
  templateUrl: './cart.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class CartComponent {
  cartService = inject(CartService);
}
