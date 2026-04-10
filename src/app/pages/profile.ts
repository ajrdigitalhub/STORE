import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { OrderService } from '../services/order';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, CommonModule, CurrencyPipe],
  templateUrl: './profile.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class ProfileComponent {
  authService = inject(AuthService);
  orderService = inject(OrderService);
}
