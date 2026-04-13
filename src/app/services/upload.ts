import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private api = inject(ApiService);

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await firstValueFrom(this.api.post<{ success: boolean; url: string; fileName: string; urls?: string[] }>('/upload', formData));
    return response.url || response.urls?.[0] || '';
  }

  async uploadImages(files: FileList | File[]): Promise<string[]> {
    const formData = new FormData();
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      formData.append('images', file);
    }

    const response = await firstValueFrom(this.api.post<{ success: boolean; url?: string; urls?: string[]; files: unknown[] }>('/upload', formData));
    if (response.urls) return response.urls;
    if (response.url) return [response.url];
    return [];
  }
}
