import { Component, inject, signal, computed, effect, untracked, AfterViewInit, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../../services/product';
import { OrderService, Order } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { ConfigService, AppConfig } from '../../services/config';
import { UploadService } from '../../services/upload';
import { ToastService } from '../../services/toast.service';
import { SkeletonComponent } from '../../components/shared/skeleton';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { animate, stagger } from 'motion';

interface Customer {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: unknown;
  created_at: string;
}

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, CurrencyPipe, SkeletonComponent, RouterLink],
  templateUrl: './dashboard.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class AdminDashboardComponent implements AfterViewInit {
  productService = inject(ProductService);
  orderService = inject(OrderService);
  authService = inject(AuthService);
  chatService = inject(ChatService);
  configService = inject(ConfigService);
  uploadService = inject(UploadService);
  toastService = inject(ToastService);
  http = inject(HttpClient);
  private el = inject(ElementRef);

  activeTab = signal<'dashboard' | 'orders' | 'products' | 'categories' | 'customers' | 'chat' | 'messages' | 'about' | 'contact' | 'payments' | 'whatsapp' | 'hero' | 'footer'>('dashboard');
  isSidebarCollapsed = signal(false);
  isMobileMenuOpen = signal(false);
  
  expandedSections = signal<Record<string, boolean>>({
    'store': true,
    'content': true,
    'communication': true
  });

  toggleSection(section: string) {
    this.expandedSections.update(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  showProductForm = signal(false);
  editingProduct = signal<Product | null>(null);
  showCategoryForm = signal(false);
  chatMessage = '';
  quickReplies = [
    'Hello! How can I assist you today?',
    'Your order is currently being processed.',
    'We offer a variety of materials including PLA, PETG, and ABS.',
    'Please share your order ID for further assistance.',
    'Thank you for reaching out to  IDEAZONE 3D!'
  ];

  whatsappSettings = {
    apiEnabled: false,
    apiUrl: '',
    apiKey: '',
    adminPhoneNumber: '',
    welcomeMessageTemplateName: '',
    orderConfirmationClientTemplateName: '',
    orderConfirmationAdminTemplateName: '',
    orderStatusUpdateTemplateName: ''
  };

  newProduct = { 
    name: '', 
    price: 0, 
    compare_price: 0, 
    category_id: 0, 
    stock: 0, 
    description: '', 
    imageUrls: [] as string[],
    featured: false,
    customizable: false,
    customization_type: 'none' as 'none' | 'text' | 'image_file'
  };
  newCategory = { name: '', description: '', image: '' };
  
  customers = signal<Customer[]>([]);
  messages = signal<Message[]>([]);

  heroForm = signal({
    slides: [] as {
      title: string;
      subtitle: string;
      imageUrl: string;
      buttonText: string;
      buttonLink: string;
    }[]
  });

  aboutForm = signal({
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    mission: '',
    vision: '',
    values: [] as { title: string; description: string; icon: string }[]
  });

  contactForm = signal({
    email: '',
    phone: '',
    address: '',
    mapUrl: ''
  });

  paymentSettings = signal({
    keyId: '',
    keySecret: '',
    enabled: false,
    codEnabled: false
  });

  footerForm = signal({
    description: '',
    socialLinks: [] as { platform: string; url: string; icon: string }[],
    copyrightText: ''
  });

  isUploading = signal(false);

  getTabDisplayName(tab: string): string {
    const names: Record<string, string> = {
      'dashboard': 'Dashboard',
      'orders': 'Orders',
      'products': 'Product Management',
      'categories': 'Categories Management',
      'customers': 'Customers',
      'chat': 'Live Chat',
      'messages': 'Messages',
      'about': 'About',
      'contact': 'Contact',
      'payments': 'Payment Settings',
      'whatsapp': 'WhatsApp Configuration',
      'hero': 'Hero Section Editor',
      'footer': 'Footer Editor'
    };
    return names[tab] || tab;
  }

  constructor() {
    effect(() => {
      const config = this.configService.config();
      
      untracked(() => {
        const currentHero = config.hero;
        // Only sync if form is currently empty (initial load)
        if (this.heroForm().slides.length === 0 && currentHero?.slides) {
          this.heroForm.set({ 
            slides: JSON.parse(JSON.stringify(currentHero.slides))
          });
        }
        if (!this.aboutForm().title && config.about?.title) {
          this.aboutForm.set({ 
            ...config.about,
            values: JSON.parse(JSON.stringify(config.about.values || []))
          });
        }
        if (!this.contactForm().email && config.contact?.email) {
          this.contactForm.set({ ...config.contact });
        }
        if (!this.paymentSettings().keyId && config.razorpay?.keyId) {
          this.paymentSettings.update(f => ({ ...f, keyId: config.razorpay.keyId, enabled: config.razorpay.enabled, codEnabled: config.razorpay.codEnabled }));
          this.loadRazorpaySecret();
        }
        if (config.whatsapp && !this.whatsappSettings.apiUrl && config.whatsapp.apiUrl) {
          this.whatsappSettings = { ...config.whatsapp };
        }
        if (!this.footerForm().description && config.footer?.description) {
          this.footerForm.set({ 
            description: config.footer.description,
            socialLinks: JSON.parse(JSON.stringify(config.footer.socialLinks || [])),
            copyrightText: config.footer.copyrightText
          });
        }
      });
    }, { allowSignalWrites: true });

    // Animate tab changes
    effect(() => {
      const tab = this.activeTab();
      untracked(() => {
        if (tab === 'customers') this.loadCustomers();
        if (tab === 'messages') this.loadMessages();
        setTimeout(() => this.animateContent(), 0);
      });
    });
  }

  async loadCustomers() {
    try {
      const res = await this.http.get<Customer[]>('/api/users').toPromise();
      if (res) this.customers.set(res);
    } catch (error) {
      console.error('Failed to load customers', error);
    }
  }

  async loadMessages() {
    try {
      const res = await this.http.get<{ messages: Message[] }>('/api/messages').toPromise();
      if (res?.messages) this.messages.set(res.messages);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  }

  async loadRazorpaySecret() {
    try {
      const res = await this.configService.getRazorpaySecret();
      if (res) {
        this.paymentSettings.update(f => ({ ...f, keySecret: res.keySecret }));
      }
    } catch (error) {
      console.warn('Razorpay secret not found', error);
    }
  }

  async saveProduct() {
    const productData = {
      name: this.newProduct.name,
      price: this.newProduct.price,
      compare_price: this.newProduct.compare_price || undefined,
      category_id: this.newProduct.category_id,
      stock: this.newProduct.stock,
      description: this.newProduct.description,
      images: this.newProduct.imageUrls,
      featured: this.newProduct.featured,
      customizable: this.newProduct.customizable,
      customization_type: this.newProduct.customization_type,
      active: true
    };

    if (this.editingProduct()) {
      await this.productService.updateProduct(this.editingProduct()!.id, productData);
      this.toastService.show('Product updated successfully', 'success');
    } else {
      await this.productService.addProduct(productData);
      this.toastService.show('Product added successfully', 'success');
    }
    
    this.cancelProductEdit();
  }

  editProduct(product: Product) {
    this.editingProduct.set(product);
    this.newProduct = {
      name: product.name,
      price: product.price,
      compare_price: product.compare_price || 0,
      category_id: product.category_id,
      stock: product.stock,
      description: product.description,
      imageUrls: [...(product.images || [])],
      featured: product.featured || false,
      customizable: product.customizable || false,
      customization_type: product.customization_type || 'none'
    };
    this.showProductForm.set(true);
    setTimeout(() => this.animateContent(), 0);
  }

  cancelProductEdit() {
    this.showProductForm.set(false);
    this.editingProduct.set(null);
    this.newProduct = { 
      name: '', 
      price: 0, 
      compare_price: 0, 
      category_id: 0, 
      stock: 0, 
      description: '', 
      imageUrls: [],
      featured: false,
      customizable: false,
      customization_type: 'none'
    };
  }

  async saveCategory() {
    await this.productService.addCategory({
      name: this.newCategory.name,
      description: this.newCategory.description,
      image: this.newCategory.image,
      active: true
    });
    this.toastService.show('Category added successfully', 'success');
    this.showCategoryForm.set(false);
    this.newCategory = { name: '', description: '', image: '' };
  }

  async deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      await this.productService.deleteCategory(id);
      this.toastService.show('Category deleted successfully', 'success');
    }
  }

  async markMessageAsRead(id: number) {
    try {
      await this.http.put(`/api/messages/${id}/read`, {}).toPromise();
      this.loadMessages();
    } catch (error) {
      console.error('Failed to mark message as read', error);
    }
  }

  async deleteMessage(id: number) {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await this.http.delete(`/api/messages/${id}`).toPromise();
        this.loadMessages();
      } catch (error) {
        console.error('Failed to delete message', error);
      }
    }
  }

  ngAfterViewInit() {
    this.animateSidebar();
    this.animateContent();
  }

  private animateSidebar() {
    const navItems = this.el.nativeElement.querySelectorAll('nav button');
    if (navItems && navItems.length > 0) {
      animate(
        navItems,
        { opacity: [0, 1], x: [-20, 0] },
        { delay: stagger(0.05), duration: 0.5, ease: 'easeOut' }
      );
    }
  }

  private animateContent() {
    const cards = this.el.nativeElement.querySelectorAll('.tech-card');
    if (cards.length > 0) {
      animate(
        cards,
        { opacity: [0, 1], y: [20, 0] },
        { delay: stagger(0.1), duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      );
    }

    const header = this.el.nativeElement.querySelector('header');
    if (header) {
      animate(
        header,
        { opacity: [0, 1], y: [-20, 0] },
        { duration: 0.8, ease: 'easeOut' }
      );
    }
  }

  async onProductImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      if (this.newProduct.imageUrls.length + files.length > 3) {
        this.toastService.show('Maximum 3 images allowed per product', 'error');
        return;
      }
      
      // Check file sizes
      for (const file of Array.from(files)) {
        if (!this.checkFileSize(file)) return;
      }

      this.isUploading.set(true);
      try {
        const urls = await this.uploadService.uploadImages(files);
        this.newProduct.imageUrls = [...this.newProduct.imageUrls, ...urls];
      } catch (error) {
        console.error('Upload failed', error);
        this.toastService.show('Image upload failed', 'error');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  async onHeroImageSelected(event: Event, slideIndex: number) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (!this.checkFileSize(file)) return;
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        const current = this.heroForm();
        const newSlides = [...current.slides];
        newSlides[slideIndex].imageUrl = url;
        this.heroForm.set({ slides: newSlides });
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  private checkFileSize(file: File): boolean {
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.toastService.show(`File ${file.name} is too large. Maximum size is 2MB.`, 'error');
      return false;
    }
    return true;
  }

  addHeroSlide() {
    const current = this.heroForm();
    this.heroForm.set({
      slides: [...current.slides, {
        title: 'New Slide',
        subtitle: 'Slide description',
        imageUrl: 'https://picsum.photos/seed/newslide/1920/1080',
        buttonText: 'Click Here',
        buttonLink: '/'
      }]
    });
  }

  removeHeroSlide(index: number) {
    const current = this.heroForm();
    const newSlides = [...current.slides];
    newSlides.splice(index, 1);
    this.heroForm.set({ slides: newSlides });
  }

  async saveHeroConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      hero: { ...this.heroForm() }
    };
    await this.configService.updateConfig(newConfig);
    this.toastService.show('Hero section updated', 'success');
  }

  async saveAboutConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      about: { ...this.aboutForm() }
    };
    await this.configService.updateConfig(newConfig);
    this.toastService.show('About section updated', 'success');
  }

  addAboutValue() {
    const current = this.aboutForm();
    this.aboutForm.set({
      ...current,
      values: [...current.values, { title: '', description: '', icon: 'star' }]
    });
  }

  removeAboutValue(index: number) {
    const current = this.aboutForm();
    const newValues = [...current.values];
    newValues.splice(index, 1);
    this.aboutForm.set({ ...current, values: newValues });
  }

  async saveContactConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      contact: { ...this.contactForm() }
    };
    await this.configService.updateConfig(newConfig);
    this.toastService.show('Contact info updated', 'success');
  }

  async saveRazorpayConfig() {
    const currentConfig = this.configService.config();
    const form = this.paymentSettings();
    
    const newConfig: AppConfig = {
      ...currentConfig,
      razorpay: {
        keyId: form.keyId,
        enabled: form.enabled,
        codEnabled: form.codEnabled
      }
    };
    
    await this.configService.updateConfig(newConfig);
    
    // Save secret separately using ConfigService
    await this.configService.setRazorpaySecret(form.keySecret);
    this.toastService.show('Payment settings updated', 'success');
  }

  async saveWhatsappSettings() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      whatsapp: { ...this.whatsappSettings }
    };
    await this.configService.updateConfig(newConfig);
    this.toastService.show('WhatsApp settings updated', 'success');
  }

  async saveFooterConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      footer: { ...this.footerForm() }
    };
    await this.configService.updateConfig(newConfig);
    this.toastService.show('Footer updated', 'success');
  }

  addSocialLink() {
    const current = this.footerForm();
    this.footerForm.set({
      ...current,
      socialLinks: [...current.socialLinks, { platform: '', url: '', icon: 'link' }]
    });
  }

  removeSocialLink(index: number) {
    const current = this.footerForm();
    const newLinks = [...current.socialLinks];
    newLinks.splice(index, 1);
    this.footerForm.set({ ...current, socialLinks: newLinks });
  }

  toggleRazorpay() {
    this.paymentSettings.update(f => ({ ...f, enabled: !f.enabled }));
  }

  toggleCod() {
    this.paymentSettings.update(f => ({ ...f, codEnabled: !f.codEnabled }));
  }

  async onCategoryImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (!this.checkFileSize(file)) return;
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        this.newCategory.image = url;
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  async onAboutImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (!this.checkFileSize(file)) return;
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        const current = this.aboutForm();
        this.aboutForm.set({
          ...current,
          imageUrl: url
        });
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  totalRevenue = computed(() => this.orderService.orders().reduce((acc, order) => acc + order.total_amount, 0));
  pendingOrders = computed(() => this.orderService.orders().filter(order => order.order_status === 'pending'));
  totalCustomers = signal(2); // Mocked for now to match screenshot
  recentOrders = computed(() => this.orderService.orders().slice(0, 5));

  async updateOrderStatus(id: number, status: Order['order_status']) {
    await this.orderService.updateOrderStatus(id, status);
  }

  sendMessage() {
    if (this.chatMessage.trim()) {
      this.chatService.sendMessage(this.chatMessage);
      this.chatMessage = '';
    }
  }

  async closeChat() {
    const selected = this.chatService.selectedChat();
    if (selected && confirm('Are you sure you want to close this chat session?')) {
      try {
        await this.chatService.closeChat(selected.id);
        this.toastService.show('Chat session closed', 'success');
      } catch (error) {
        console.error('Failed to close chat', error);
        this.toastService.show('Failed to close session', 'error');
      }
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
}
