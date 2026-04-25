import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService, Message } from '../../services/chat';
import { AuthService } from '../../services/auth';

interface QuickAction {
  label: string;
  icon: string;
  message: string;
}

@Component({
  selector: 'app-chat-fab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <!-- WhatsApp FAB (Always visible) -->
      <a 
        [href]="whatsappUrl" 
        target="_blank" 
        class="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group relative"
        title="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.048a11.827 11.827 0 001.592 5.991L0 24l6.117-1.605a11.803 11.803 0 005.925 1.598h.005c6.637 0 12.046-5.414 12.049-12.05a11.823 11.823 0 00-3.417-8.444"/>
        </svg>
        <span class="absolute right-full mr-4 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          WhatsApp Support
        </span>
      </a>

      <!-- Quick Chat Window Container -->
      <div class="relative">
        <button 
          (click)="toggleChat()" 
          class="w-14 h-14 bg-accent text-metallic-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
        >
          <span class="material-icons text-3xl">{{ isOpen() ? 'close' : 'chat' }}</span>
          @if (!isOpen() && chatService.unreadCount() > 0) {
            <span class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-metallic-black">
              {{ chatService.unreadCount() }}
            </span>
          }
        </button>

        <!-- Chat Window -->
        @if (isOpen()) {
          <div class="absolute bottom-20 right-0 w-[300px] sm:w-[350px] h-[450px] sm:h-[500px] bg-metallic-black border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <!-- Header -->
            <div class="p-6 bg-accent/5 border-b border-white/5 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <span class="material-icons">smart_toy</span>
              </div>
              <div>
                <h3 class="font-bold text-sm">IDEA Zone AI</h3>
                <p class="text-[10px] text-accent-muted uppercase tracking-widest">Assistant</p>
              </div>
            </div>

            <!-- Messages Container -->
            <div class="flex-grow flex flex-col min-h-0">
              <div #scrollContainer class="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
                @if (chatService.messages().length === 0) {
                  <div class="flex flex-col items-center justify-center h-full text-center opacity-40 py-8">
                    <span class="material-icons text-4xl mb-2 text-accent">chat_bubble_outline</span>
                    <p class="text-xs">Send a message to start.</p>
                  </div>
                }

                @for (msg of chatService.messages(); track msg.timestamp) {
                  <div class="flex flex-col" [class.items-end]="isMe(msg)" [class.items-start]="!isMe(msg)">
                    <div 
                      class="max-w-[85%] p-3 rounded-2xl text-sm"
                      [class.bg-accent]="isMe(msg)"
                      [class.text-metallic-black]="isMe(msg)"
                      [class.bg-white/5]="!isMe(msg)"
                      [class.text-white]="!isMe(msg)"
                      [class.rounded-tr-none]="isMe(msg)"
                      [class.rounded-tl-none]="!isMe(msg)"
                    >
                      {{ msg.text }}
                    </div>
                    <span class="text-[8px] text-accent-muted mt-1 px-1 uppercase tracking-tighter">
                      {{ msg.sender_name }} • {{ msg.timestamp | date:'shortTime' }}
                    </span>
                  </div>
                }

                @if (chatService.isTyping() || isTyping()) {
                  <div class="flex items-start gap-2">
                    <div class="bg-white/5 p-3 rounded-2xl rounded-tl-none flex gap-1">
                      <div class="w-1 h-1 bg-accent rounded-full animate-bounce"></div>
                      <div class="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div class="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                }

                <!-- WhatsApp Handoff Action -->
                @if (showWhatsAppHandoff()) {
                  <div class="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2 pb-4">
                    <button 
                      (click)="confirmWhatsApp()"
                      class="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl uppercase tracking-widest"
                    >
                      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.048a11.827 11.827 0 001.592 5.991L0 24l6.117-1.605a11.803 11.803 0 005.925 1.598h.005c6.637 0 12.046-5.414 12.049-12.05a11.823 11.823 0 00-3.417-8.444"/>
                      </svg>
                      Connect on WhatsApp
                    </button>
                    <p class="text-[9px] text-accent-muted text-center mt-2 uppercase tracking-tighter">Fast response guaranteed</p>
                  </div>
                }

                <!-- Quick Actions -->
                @if (chatService.messages().length < 2 && !showWhatsAppHandoff()) {
                  <div class="space-y-2 pt-4">
                    <p class="text-[10px] text-accent-muted uppercase tracking-widest mb-3">Quick Actions</p>
                    @for (action of quickActions; track action.label) {
                      <button 
                        (click)="sendQuickAction(action)"
                        class="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-accent/10 border border-white/5 hover:border-accent/20 transition-all text-xs flex items-center gap-3 group"
                      >
                        <span class="material-icons text-accent text-sm group-hover:scale-110 transition-transform">{{ action.icon }}</span>
                        {{ action.label }}
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Input -->
              <div class="p-4 bg-white/5 border-t border-white/5">
                <div class="relative">
                  <input 
                    [(ngModel)]="messageText" 
                    (keyup.enter)="sendMessage()"
                    placeholder="Type your message..." 
                    class="w-full bg-metallic-black border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm focus:border-accent outline-none transition-colors"
                  >
                  <button 
                    (click)="sendMessage()"
                    [disabled]="!messageText.trim()"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-accent disabled:text-accent-muted hover:scale-110 transition-transform"
                  >
                    <span class="material-icons">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ChatFabComponent implements AfterViewChecked {
  chatService = inject(ChatService);
  authService = inject(AuthService);
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  isTyping = signal(false);
  showWhatsAppHandoff = signal(false);
  messageText = '';
  lastUserMessage = signal('');

  private hasSentWelcome = false;

  whatsappNumber = '8903035099';
  whatsappMessage = 'I IDEAZONE 3D, i need to explore more products, could you share more details on this';
  
  get whatsappUrl() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappMessage)}`;
  }

  quickActions: QuickAction[] = [
    { label: 'Bulk Order Pricing', icon: 'payments', message: 'I need to inquire about bulk ordering more products.' },
    { label: 'Product Inquiry', icon: 'inventory_2', message: 'I have a question about a product customization.' },
    { label: 'Check Order Status', icon: 'local_shipping', message: 'I want to check my order status.' },
    { label: 'Technical Support', icon: 'build', message: 'I need help with my 3D design file.' }
  ];

  toggleChat() {
    this.isOpen.update(v => !v);
    this.chatService.setChatOpen(this.isOpen());
    
    if (this.isOpen()) {
      if (!this.hasSentWelcome && this.chatService.messages().length === 0) {
        this.isTyping.set(true);
        const userId = this.chatService.getEffectiveUserId();
        setTimeout(() => {
          if (userId) {
            this.chatService.sendBotMessage('Hi! I\'m the AI assistant. You can ask me anything or connect directly with our sales team via WhatsApp.', userId);
          }
          this.isTyping.set(false);
          this.hasSentWelcome = true;
        }, 1200);
      }
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  isMe(msg: Message) {
    return msg.sender_id === this.chatService.getEffectiveUserId();
  }

  sendMessage() {
    if (this.messageText.trim()) {
      const text = this.messageText;
      this.lastUserMessage.set(text);
      this.chatService.sendMessage(text);
      this.messageText = '';
      this.triggerHandoff();
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendQuickAction(action: QuickAction) {
    this.lastUserMessage.set(action.message);
    this.chatService.sendMessage(action.message);
    this.triggerHandoff();
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private triggerHandoff() {
    const text = this.lastUserMessage().trim().toLowerCase();
    const commonWords = ['hi', 'hello', 'hey', 'okay', 'ok', 'thanks', 'thank you', 'thx', 'bye', 'goodbye', 'yep', 'no'];
    
    // Check if it's a common greeting or very short message
    const isCommon = commonWords.includes(text) || (text.split(' ').length < 2 && text.length < 5);
    
    const userId = this.chatService.getEffectiveUserId();
    this.isTyping.set(true);
    
    setTimeout(() => {
      this.isTyping.set(false);
      
      if (isCommon) {
        // Simple response for common words, no handoff
        let response = "I'm here to help! You can ask about bulk orders, product customization, or shipping.";
        if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
          response = "Hello! How can I help you today?";
        } else if (text.includes('thank')) {
          response = "You're welcome! Let me know if you need anything else.";
        } else if (text.includes('bye')) {
          response = "Goodbye! Have a wonderful day.";
        }
        
        this.chatService.sendBotMessage(response, userId);
        this.showWhatsAppHandoff.set(false);
      } else {
        // Substantial inquiry, trigger handoff
        this.chatService.sendBotMessage('Got it! Would you like to continue this chat on WhatsApp for a faster response from our team?', userId);
        this.showWhatsAppHandoff.set(true);
      }
      
      setTimeout(() => this.scrollToBottom(), 100);
    }, 1500);
  }

  confirmWhatsApp() {
    const text = this.lastUserMessage().trim();
    
    // Filter out common short words if they are the last message
    const commonWords = ['hi', 'hello', 'hey', 'okay', 'ok', 'thanks', 'thank you', 'thx', 'bye'];
    const isCommon = commonWords.includes(text.toLowerCase());
    
    let finalMessage = '';
    if (text && !isCommon) {
      finalMessage = `Hi IDEAZONE 3D, ${text}`;
    } else {
      finalMessage = this.whatsappMessage;
    }
    
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
    window.open(url, '_blank');
  }

  ngAfterViewChecked() {
    if (this.isOpen()) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll errors
    }
  }
}
