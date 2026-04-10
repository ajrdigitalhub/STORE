import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { authGuard, adminGuard } from './guards/auth';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products', loadComponent: () => import('./pages/product-list').then(m => m.ProductListComponent) },
  { path: 'products/:id', loadComponent: () => import('./pages/product-detail').then(m => m.ProductDetailComponent) },
  { path: 'cart', loadComponent: () => import('./pages/cart').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout').then(m => m.CheckoutComponent) },
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.LoginComponent) },
  { path: 'profile', loadComponent: () => import('./pages/profile').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./pages/admin/dashboard').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
  { path: 'about', loadComponent: () => import('./pages/about').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact').then(m => m.ContactComponent) },
  { path: '**', redirectTo: '' }
];
