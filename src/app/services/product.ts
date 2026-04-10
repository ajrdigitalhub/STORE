import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name?: string;
  images: string[];
  stock: number;
  is_featured: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private productsSignal = signal<Product[]>([]);
  products = this.productsSignal.asReadonly();
  
  private categoriesSignal = signal<Category[]>([]);
  categories = this.categoriesSignal.asReadonly();
  
  useMockData = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkConfig();
      this.loadProducts();
      this.loadCategories();
    }
  }

  private async checkConfig() {
    try {
      const config = await this.http.get<{ useMockData: boolean }>('/api/runtime-config').toPromise();
      if (config) {
        this.useMockData.set(config.useMockData);
        this.loadProducts();
        this.loadCategories();
      }
    } catch (error: unknown) {
      console.error('Failed to load config', error instanceof Error ? error.message : error);
    }
  }

  async toggleMockData(useMock: boolean) {
    try {
      await this.http.post('/api/runtime-config', { useMockData: useMock }).toPromise();
      this.useMockData.set(useMock);
      this.loadProducts();
      this.loadCategories();
    } catch (error: unknown) {
      console.error('Failed to toggle mock data', error instanceof Error ? error.message : error);
    }
  }

  private loadProducts() {
    this.http.get<Product[]>('http://localhost:3000/api/products').subscribe({
      next: (products) => {
        this.productsSignal.set(products);
      },
      error: (error) => {
        console.error('Failed to load products', error);
      }
    });
  }

  private loadCategories() {
    this.http.get<Category[]>('/api/categories').subscribe({
      next: (categories) => {
        this.categoriesSignal.set(categories);
      },
      error: (error) => {
        console.error('Failed to load categories', error);
      }
    });
  }

  async addProduct(product: Omit<Product, 'id' | 'created_at'>) {
    const res = await this.http.post<Product>('/api/products', product).toPromise();
    this.loadProducts();
    return res;
  }

  async updateProduct(id: number, product: Partial<Product>) {
    const res = await this.http.patch<Product>(`/api/products/${id}`, product).toPromise();
    this.loadProducts();
    return res;
  }

  async deleteProduct(id: number) {
    const res = await this.http.delete(`/api/products/${id}`).toPromise();
    this.loadProducts();
    return res;
  }

  // Category methods
  async addCategory(category: Omit<Category, 'id' | 'created_at'>) {
    const res = await this.http.post<Category>('/api/categories', category).toPromise();
    this.loadCategories();
    return res;
  }

  async updateCategory(id: number, category: Partial<Category>) {
    const res = await this.http.put<Category>(`/api/categories/${id}`, category).toPromise();
    this.loadCategories();
    return res;
  }

  async deleteCategory(id: number) {
    const res = await this.http.delete(`/api/categories/${id}`).toPromise();
    this.loadCategories();
    return res;
  }
}
