import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <h1 class="text-2xl font-bold text-chrome-100 mb-6">Customer Chat</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4" style="height: calc(100vh - 200px);">
        <!-- Chat List -->
        <div class="metallic-card overflow-hidden flex flex-col">
          <div class="p-3 border-b border-chrome-700">
            <h3 class="text-chrome-300 text-sm font-medium">Conversations</h3>
          </div>
          <div class="flex-1 overflow-y-auto">
            @for (chat of chatList; track chat._id) {
              <button (click)="selectChat(chat)"
                [class]="selectedChatId === chat._id ? 'bg-chrome-800 border-l-2 border-chrome-300' : 'hover:bg-chrome-800/50'"
                class="w-full text-left p-4 border-b border-chrome-800/50 transition-colors">
                <p class="text-chrome-200 text-sm font-medium">{{ chat.customerName || chat.customer?.name || 'Customer' }}</p>
                <p class="text-chrome-500 text-xs truncate mt-1">{{ chat.lastMessage || 'No messages' }}</p>
                <p class="text-chrome-600 text-xs mt-1">{{ chat.lastMessageAt | date:'short' }}</p>
              </button>
            }
            @if (chatList.length === 0) {
              <div class="p-6 text-center text-chrome-600 text-sm">No active conversations</div>
            }
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="lg:col-span-2 metallic-card overflow-hidden flex flex-col">
          @if (selectedChatId) {
            <div class="p-4 border-b border-chrome-700 bg-chrome-900">
              <h3 class="text-chrome-200 text-sm font-medium">{{ selectedCustomerName }}</h3>
            </div>

            <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-3">
              @for (msg of messages; track msg.timestamp) {
                <div [class]="msg.sender === 'admin' ? 'flex justify-end' : 'flex justify-start'">
                  <div [class]="msg.sender === 'admin'
                    ? 'bg-gradient-to-br from-chrome-300 to-chrome-400 text-chrome-950 rounded-2xl rounded-br-sm px-4 py-2 max-w-[75%]'
                    : 'bg-chrome-800 text-chrome-200 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[75%] border border-chrome-700'">
                    <p class="text-xs font-medium mb-1 opacity-70">{{ msg.senderName }}</p>
                    <p class="text-sm">{{ msg.text }}</p>
                    <p class="text-xs mt-1 opacity-60">{{ msg.timestamp | date:'shortTime' }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="p-3 border-t border-chrome-700">
              <div class="flex space-x-2">
                <input [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Reply to customer..."
                  class="metallic-input text-sm flex-1" />
                <button (click)="sendMessage()" class="metallic-btn-primary metallic-btn px-4">Send</button>
              </div>
            </div>
          } @else {
            <div class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <svg class="w-12 h-12 mx-auto text-chrome-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p class="text-chrome-600 text-sm">Select a conversation to reply</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AdminChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  chatList: any[] = [];
  messages: ChatMessage[] = [];
  selectedChatId = '';
  selectedCustomerId = '';
  selectedCustomerName = '';
  newMessage = '';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.connect();
    this.chatService.loadChatList();
    this.chatService.chatList$.subscribe(chats => this.chatList = chats);
    this.chatService.messages$.subscribe(msgs => this.messages = msgs);
  }

  ngAfterViewChecked(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  selectChat(chat: any): void {
    this.selectedChatId = chat._id;
    this.selectedCustomerId = chat.customer?._id || chat.customer;
    this.selectedCustomerName = chat.customerName || chat.customer?.name || 'Customer';
    this.chatService.loadChatHistory(this.selectedCustomerId);
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedCustomerId) return;
    this.chatService.sendAdminMessage(this.newMessage.trim(), this.selectedCustomerId);
    this.newMessage = '';
    setTimeout(() => this.chatService.loadChatHistory(this.selectedCustomerId), 500);
  }
}
