import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (authService.isLoggedIn && !authService.isAdmin) {
      <!-- Chat Toggle Button -->
      <button (click)="toggleChat()" class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-chrome-200 to-chrome-500 text-chrome-950 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center">
        @if (isOpen) {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        } @else {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        }
      </button>

      <!-- Chat Panel -->
      @if (isOpen) {
        <div class="fixed bottom-24 right-6 z-50 w-80 sm:w-96 metallic-card flex flex-col animate-slide-up" style="height: 420px;">
          <!-- Header -->
          <div class="p-4 border-b border-chrome-700 bg-gradient-to-r from-chrome-800 to-chrome-900 rounded-t-xl">
            <h3 class="text-chrome-200 font-semibold text-sm">Live Support</h3>
            <p class="text-chrome-500 text-xs mt-1">We typically reply within minutes</p>
          </div>

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (messages.length === 0) {
              <div class="text-center py-8">
                <p class="text-chrome-500 text-sm">No messages yet</p>
                <p class="text-chrome-600 text-xs mt-1">Start a conversation with us!</p>
              </div>
            }
            @for (msg of messages; track msg.timestamp) {
              <div [class]="msg.sender === 'customer' ? 'flex justify-end' : 'flex justify-start'">
                <div [class]="msg.sender === 'customer'
                  ? 'bg-gradient-to-br from-chrome-300 to-chrome-400 text-chrome-950 rounded-2xl rounded-br-sm px-4 py-2 max-w-[75%]'
                  : 'bg-chrome-800 text-chrome-200 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[75%] border border-chrome-700'">
                  <p class="text-sm">{{ msg.text }}</p>
                  <p class="text-xs mt-1 opacity-60">{{ msg.timestamp | date:'shortTime' }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-3 border-t border-chrome-700">
            <div class="flex space-x-2">
              <input [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..."
                class="metallic-input text-sm flex-1" />
              <button (click)="sendMessage()" class="metallic-btn-primary metallic-btn px-3 py-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  isOpen = false;
  newMessage = '';
  messages: ChatMessage[] = [];

  constructor(public authService: AuthService, private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.chatService.connect();
      this.chatService.loadChatHistory();
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatService.sendCustomerMessage(this.newMessage.trim());
    this.newMessage = '';
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (e) {}
  }
}
