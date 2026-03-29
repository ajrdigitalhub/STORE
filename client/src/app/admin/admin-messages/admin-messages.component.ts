import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, ContactMessage } from '../../services/message.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Contact Messages</h1>
        <div class="text-chrome-500 text-sm">Total: {{ messages.length }}</div>
      </div>

      <div class="metallic-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-chrome-900/50 border-b border-chrome-800">
                <th class="px-6 py-4 text-xs uppercase tracking-wider text-chrome-400 font-semibold">Date</th>
                <th class="px-6 py-4 text-xs uppercase tracking-wider text-chrome-400 font-semibold">Sender</th>
                <th class="px-6 py-4 text-xs uppercase tracking-wider text-chrome-400 font-semibold">Subject</th>
                <th class="px-6 py-4 text-xs uppercase tracking-wider text-chrome-400 font-semibold">Status</th>
                <th class="px-6 py-4 text-xs uppercase tracking-wider text-chrome-400 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-chrome-800">
              @for (msg of messages; track msg._id) {
                <tr class="hover:bg-chrome-800/30 transition-colors group">
                  <td class="px-6 py-4 text-sm text-chrome-300">
                    {{ msg.createdAt | date:'short' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-white">{{ msg.name }}</div>
                    <div class="text-xs text-chrome-500">{{ msg.email }}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-chrome-300">
                    {{ msg.subject }}
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="getStatusClass(msg.status)">
                      {{ msg.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right space-x-3">
                    <button (click)="viewMessage(msg)" class="text-chrome-400 hover:text-white transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button (click)="deleteMessage(msg._id!)" class="text-chrome-600 hover:text-red-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @if (messages.length === 0) {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-chrome-600 italic">
                    No messages found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Message Detail Modal -->
      @if (selectedMessage) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div class="metallic-card w-full max-w-2xl overflow-hidden animate-slide-up">
            <div class="p-6 border-b border-chrome-800 flex items-center justify-between">
              <h2 class="text-xl font-bold text-white">Message Details</h2>
              <button (click)="selectedMessage = null" class="text-chrome-500 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="p-8 space-y-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="text-xs uppercase tracking-wider text-chrome-500 block mb-1">From</label>
                  <p class="text-white font-medium">{{ selectedMessage.name }}</p>
                  <p class="text-chrome-400 text-sm">{{ selectedMessage.email }}</p>
                </div>
                <div>
                  <label class="text-xs uppercase tracking-wider text-chrome-500 block mb-1">Date</label>
                  <p class="text-chrome-300">{{ selectedMessage.createdAt | date:'medium' }}</p>
                </div>
              </div>
              <div>
                <label class="text-xs uppercase tracking-wider text-chrome-500 block mb-1">Subject</label>
                <p class="text-white font-bold">{{ selectedMessage.subject }}</p>
              </div>
              <div class="glass-panel p-6 bg-chrome-900/50">
                <label class="text-xs uppercase tracking-wider text-chrome-500 block mb-3">Message Content</label>
                <p class="text-chrome-300 leading-relaxed whitespace-pre-wrap">
                  {{ selectedMessage.message }}
                </p>
              </div>

              <div class="flex items-center justify-between pt-4 border-t border-chrome-800">
                <div class="flex items-center space-x-3">
                  <label class="text-sm text-chrome-400">Mark as:</label>
                  <select (change)="updateStatus(selectedMessage._id!, $any($event.target).value)" 
                    class="bg-chrome-900 border border-chrome-700 text-chrome-300 text-sm rounded-lg p-1.5 focus:border-chrome-500 outline-none">
                    <option value="new" [selected]="selectedMessage.status === 'new'">New</option>
                    <option value="read" [selected]="selectedMessage.status === 'read'">Read</option>
                    <option value="replied" [selected]="selectedMessage.status === 'replied'">Replied</option>
                  </select>
                </div>
                <button (click)="selectedMessage = null" class="metallic-btn text-sm px-6">Close</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminMessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  selectedMessage: ContactMessage | null = null;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.messageService.getMessages().subscribe(data => this.messages = data);
  }

  viewMessage(msg: ContactMessage): void {
    this.selectedMessage = msg;
    if (msg.status === 'new') {
      this.updateStatus(msg._id!, 'read');
    }
  }

  updateStatus(id: string, status: string): void {
    this.messageService.updateStatus(id, status).subscribe(() => {
      this.loadMessages();
      if (this.selectedMessage && this.selectedMessage._id === id) {
        this.selectedMessage.status = status as any;
      }
    });
  }

  deleteMessage(id: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messageService.deleteMessage(id).subscribe(() => this.loadMessages());
    }
  }

  getStatusClass(status: string): string {
    const base = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ";
    switch (status) {
      case 'new': return base + "bg-chrome-200 text-chrome-950 border border-chrome-300";
      case 'read': return base + "bg-chrome-800 text-chrome-400 border border-chrome-700";
      case 'replied': return base + "bg-green-500/20 text-green-400 border border-green-500/30";
      default: return base + "bg-chrome-900 text-chrome-500";
    }
  }
}
