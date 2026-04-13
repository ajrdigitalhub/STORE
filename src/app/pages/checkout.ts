import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart';
import { OrderService } from '../services/order';
import { PaymentService } from '../services/payment';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Razorpay: any;

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
  authService = inject(AuthService);
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
  paymentMethod = signal<'COD' | 'Razorpay'>('COD');
  isProcessing = signal(false);

  async placeOrder() {
    this.isProcessing.set(true);
    try {
      const total = this.cartService.totalPrice() * 1.18;

      if (this.paymentMethod() === 'Razorpay') {
        const success = await this.paymentService.loadRazorpayScript();
        if (!success) throw new Error('Razorpay SDK failed to load');

        const rzpOrder = await this.paymentService.createRazorpayOrder(total);
        const rzpKey = await this.paymentService.getRazorpayKey();
        
        const options = {
          key: rzpKey,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "IDEA Zone 3D",
          description: "Order Payment",
          order_id: rzpOrder.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async (response: any) => {
            await this.paymentService.verifyPayment(response);
            await this.finalizeOrder(total, 'paid');
          },
          prefill: {
            name: this.address.name,
            contact: this.address.phone,
            email: this.authService.profile()?.email || ''
          },
          theme: { color: "#e5e5e5" }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        await this.finalizeOrder(total, 'pending');
      }
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert('Order failed. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async finalizeOrder(total_amount: number, payment_status: 'paid' | 'pending') {
    const profile = this.authService.profile();
    await this.orderService.createOrder({
      userid: profile?.id || 0,
      items: this.cartService.items().map(item => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images[0]
      })),
      total_amount,
      order_status: 'pending',
      payment_status,
      payment_method: this.paymentMethod().toLowerCase() as 'razorpay' | 'cod',
      shipping_address: this.address
    });
    this.cartService.clearCart();
    
    if (profile) {
      this.router.navigate(['/profile']);
    } else {
      alert('Order placed successfully!');
      this.router.navigate(['/']);
    }
  }
}
