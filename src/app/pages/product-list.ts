import { Component, inject, computed } from '@angular/core';
import { ProductService } from '../services/product';
import { CartService } from '../services/cart';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ProductCardComponent } from '../components/shared/product-card';

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, ProductCardComponent],
  templateUrl: './product-list.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class ProductListComponent {
  productService = inject(ProductService);
  cartService = inject(CartService);

  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  sortControl = new FormControl('name');

  filteredProducts = computed(() => {
    const searchQuery = this.searchControl.value?.toLowerCase() || '';
    const selectedCategory = this.categoryControl.value || '';
    const sortBy = this.sortControl.value || 'name';
    
    let products = this.productService.products().filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery) || 
                           product.description.toLowerCase().includes(searchQuery);
      const matchesCategory = !selectedCategory || product.category_id === Number(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      products = products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      products = products.sort((a, b) => b.price - a.price);
    } else {
      products = products.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return products;
  });
}
