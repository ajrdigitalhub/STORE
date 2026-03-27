import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-12">
      <div class="relative">
        <div class="w-12 h-12 rounded-full border-2 border-chrome-700 border-t-chrome-300 animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-6 h-6 rounded-full border-2 border-chrome-600 border-b-chrome-200 animate-spin" style="animation-direction: reverse;"></div>
        </div>
      </div>
    </div>
  `
})
export class LoadingComponent {}
