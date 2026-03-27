import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="border-t border-chrome-800 bg-chrome-950 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-chrome-200 to-chrome-500 flex items-center justify-center">
                <span class="text-chrome-950 font-bold text-sm">S</span>
              </div>
              <span class="text-lg font-bold text-chrome-200">STORE</span>
            </div>
            <p class="text-chrome-500 text-sm leading-relaxed">Premium shopping experience with the finest products curated just for you.</p>
          </div>
          <div>
            <h4 class="text-chrome-200 font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <div class="flex flex-col space-y-2">
              <a routerLink="/" class="text-chrome-500 hover:text-chrome-200 text-sm transition-colors">Home</a>
              <a routerLink="/cart" class="text-chrome-500 hover:text-chrome-200 text-sm transition-colors">Cart</a>
              <a routerLink="/orders" class="text-chrome-500 hover:text-chrome-200 text-sm transition-colors">Orders</a>
            </div>
          </div>
          <div>
            <h4 class="text-chrome-200 font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <div class="flex flex-col space-y-2 text-chrome-500 text-sm">
              <span>support&#64;store.com</span>
              <span>+91 99999 99999</span>
              <span>Mumbai, India</span>
            </div>
          </div>
        </div>
        <div class="border-t border-chrome-800 mt-8 pt-8 text-center">
          <p class="text-chrome-600 text-xs">&copy; 2024 STORE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
