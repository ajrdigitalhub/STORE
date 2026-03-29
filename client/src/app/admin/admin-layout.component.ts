import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex min-h-screen pt-16">
      <!-- Sidebar -->
      <aside class="w-64 fixed left-0 top-16 bottom-0 bg-chrome-950 border-r border-chrome-800 overflow-y-auto hidden lg:block">
        <nav class="p-4 space-y-1">
          <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/orders" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Orders</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>Products</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            <span>Categories</span>
          </a>
          <a routerLink="/admin/customers" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span>Customers</span>
          </a>
          <a routerLink="/admin/chat" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span>Chat</span>
          </a>
          <a routerLink="/admin/messages" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span>Messages</span>
          </a>
          <a routerLink="/admin/about" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>About Edit</span>
          </a>
          <a routerLink="/admin/contact" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>Contact Edit</span>
          </a>
          <a routerLink="/admin/payment" routerLinkActive="bg-chrome-800 text-white"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg text-chrome-400 hover:text-white hover:bg-chrome-800/50 transition-all text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            <span>Payment Settings</span>
          </a>
        </nav>
      </aside>

      <!-- Mobile bottom nav -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-chrome-950 border-t border-chrome-800 flex justify-around py-2">
        <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="text-white" class="text-chrome-500 p-2 text-xs text-center">
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Home
        </a>
        <a routerLink="/admin/orders" routerLinkActive="text-white" class="text-chrome-500 p-2 text-xs text-center">
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Orders
        </a>
        <a routerLink="/admin/products" routerLinkActive="text-white" class="text-chrome-500 p-2 text-xs text-center">
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Products
        </a>
        <a routerLink="/admin/chat" routerLinkActive="text-white" class="text-chrome-500 p-2 text-xs text-center">
          <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          Chat
        </a>
      </div>

      <!-- Content -->
      <main class="flex-1 lg:ml-64 p-6 pb-20 lg:pb-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {}
