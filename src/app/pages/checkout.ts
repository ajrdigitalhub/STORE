import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart';
import { OrderService } from '../services/order';
import { PaymentService } from '../services/payment';
import { ConfigService } from '../services/config';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Razorpay: any;

import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, CommonModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class CheckoutComponent {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  paymentService = inject(PaymentService);
  configService = inject(ConfigService);
  authService = inject(AuthService);
  apiService = inject(ApiService);
  toastService = inject(ToastService);
  router = inject(Router);

  address = { 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    state: '', 
    zip: '' 
  };
  paymentMethod = signal<'Razorpay' | 'cod'>('Razorpay');
  isProcessing = signal(false);
  showGuestPopup = signal(false);

  constructor() {
    const profile = this.authService.profile();
    if (profile) {
      this.address.name = profile.name || '';
      this.address.email = profile.email || '';
      this.address.phone = profile.phone || '';
      if (profile.address) {
        this.address.address = profile.address.street || '';
        this.address.city = profile.address.city || '';
        this.address.state = profile.address.state || '';
        this.address.zip = profile.address.zip || '';
      }
      // Track registered checkout start
      this.apiService.post('/analytics/event', { eventType: 'checkout_start_registered' }).subscribe({
        error: (err) => console.error('Failed to log checkout start registered:', err)
      });
    } else {
      this.showGuestPopup.set(true);
    }
  }

  startGuestCheckoutAnalytics() {
    this.apiService.post('/analytics/event', { eventType: 'checkout_start_guest' }).subscribe({
      error: (err) => console.error('Failed to log checkout start guest:', err)
    });
  }

  redirectToLogin() {
    this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
  }

  get isCodEnabled() {
    return this.configService.config().razorpay.codEnabled;
  }

  async placeOrder() {
    if (!this.validateForm()) return;

    this.isProcessing.set(true);
    try {
      const subtotal = this.cartService.totalPrice();
      const gstAmount = 0;
      const shippingCharge = 0; // FREE shipping
      const total = subtotal + gstAmount + shippingCharge;
      
      const profile = this.authService.profile();
      const isGuest = !profile;

      const orderItems = this.cartService.items().map(item => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images && item.images.length > 0 ? item.images[0] : '',
        customization: item.customization
      }));

      if (this.paymentMethod() === 'Razorpay') {
        // 1. Initiate Razorpay
        const success = await this.paymentService.loadRazorpayScript();
        if (!success) throw new Error('Razorpay SDK failed to load');

        const rzpOrder = await this.paymentService.createRazorpayOrder(total);
        const rzpKey = await this.paymentService.getRazorpayKey();
        
        const options = {
          key: rzpKey,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "IDEAZONE 3D",
          description: "Order Payment",
          order_id: rzpOrder.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async (response: any) => {
            try {
              // 2. Create order ONLY after successful payment
              const order = await this.orderService.createOrder({
                userid: profile ? profile.id : null,
                items: orderItems,
                total_amount: total,
                gst_amount: gstAmount,
                shipping_charge: shippingCharge,
                payment_method: 'razorpay',
                shipping_address: this.address,
                razorpay_orderid: response.razorpay_orderid,
                razorpay_paymentid: response.razorpay_paymentid,
                razorpay_signature: response.razorpay_signature,
                isGuest: isGuest,
                guestName: isGuest ? this.address.name : null,
                guestPhone: isGuest ? this.address.phone : null,
                guestEmail: isGuest ? this.address.email : null,
                firebaseUid: profile ? (this.authService.user()?.uid || null) : null
              } as any);

              this.toastService.show('Order placed successfully!', 'success');
              this.cartService.clearCart();
              // For guests, direct them to tracking page or order success page. We can navigate to tracking page, 
              // or let them view the order-detail page since our optionalAuth / public track page is available.
              // Wait, since order-detail page requires login, redirecting a guest to /orders/id will trigger login redirect!
              // So for guests, we MUST navigate them to the public tracking page /track?orderNumber=ORD-XXX&phone=YYY!
              if (isGuest) {
                this.router.navigate(['/track'], { queryParams: { orderNumber: order.order_number, phone: this.address.phone } });
              } else {
                this.router.navigate(['/orders', order.id]);
              }
            } catch (err) {
              console.error('Order creation failed', err);
              this.toastService.show('Order creation failed. Please contact support.', 'error');
            } finally {
              this.isProcessing.set(false);
            }
          },
          prefill: {
            name: this.address.name,
            contact: this.address.phone,
            email: this.address.email || (this.authService.profile()?.email || '')
          },
          theme: { color: "#e5e5e5" },
          modal: {
            ondismiss: () => {
              this.isProcessing.set(false);
            }
          }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // COD Flow
        const order = await this.orderService.createOrder({
          userid: profile ? profile.id : null,
          items: orderItems,
          total_amount: total,
          gst_amount: gstAmount,
          shipping_charge: shippingCharge,
          order_status: 'pending',
          payment_status: 'pending',
          payment_method: 'cod',
          shipping_address: this.address,
          isGuest: isGuest,
          guestName: isGuest ? this.address.name : null,
          guestPhone: isGuest ? this.address.phone : null,
          guestEmail: isGuest ? this.address.email : null,
          firebaseUid: profile ? (this.authService.user()?.uid || null) : null
        });
        this.toastService.show('Order placed successfully!', 'success');
        this.cartService.clearCart();
        if (isGuest) {
          this.router.navigate(['/track'], { queryParams: { orderNumber: order.order_number, phone: this.address.phone } });
        } else {
          this.router.navigate(['/orders', order.id]);
        }
        this.isProcessing.set(false);
      }
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      this.toastService.show('Order failed. Please try again.', 'error');
      this.isProcessing.set(false);
    }
  }

  private validateForm(): boolean {
    const { name, email, phone, address, city, state, zip } = this.address;
    if (!name || !email || !phone || !address || !city || !state || !zip) {
      this.toastService.show('Please fill in all shipping details.', 'error');
      return false;
    }
    
    const items = this.cartService.items();
    if (items.length === 0) {
      this.toastService.show('Your cart is empty.', 'error');
      return false;
    }

    const invalidItems = items.filter(item => !item.id);
    if (invalidItems.length > 0) {
      console.error('CheckoutComponent - Invalid items in cart:', invalidItems);
      this.toastService.show('Some items in your cart are invalid. Please clear your cart and try again.', 'error');
      return false;
    }

    return true;
  }
}
