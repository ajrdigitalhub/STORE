import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/admin-products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./admin/admin-customers/admin-customers.component').then(m => m.AdminCustomersComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./admin/admin-chat/admin-chat.component').then(m => m.AdminChatComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./admin/admin-about/admin-about.component').then(m => m.AdminAboutComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./admin/admin-messages/admin-messages.component').then(m => m.AdminMessagesComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./admin/admin-contact/admin-contact.component').then(m => m.AdminContactComponent)
      },
      {
        path: 'payment',
        loadComponent: () => import('./admin/admin-payment-config.component').then(m => m.AdminPaymentConfigComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
