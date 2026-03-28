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
                <!-- Here the footer image  -->
              <!-- <span class="text-chrome-950 font-bold text-sm">S</span> -->
                <span class="text-chrome-950 font-bold text-sm">
                  <img src="data:image/png;base64,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" alt=""></span>

              </div>
              <span class="text-lg font-bold text-chrome-200">IDEAZONE3D</span>
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
              <span>ideazone3d&#64;gmail.com</span>
              <span>+91 99890 13142</span>
              <span>Hyderabad, India</span>
            </div>
          </div>
        </div>
        <div class="border-t border-chrome-800 mt-8 pt-8 text-center">
          <p class="text-chrome-600 text-xs">&copy; 2026 Ideazone3D. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
