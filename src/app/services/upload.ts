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

    const response = await firstValueFrom(this.api.post<{ success: boolean; url: string; fileName: string }>('/upload', formData));
    return response.url || (response as any).urls?.[0];
  }

  async uploadImages(files: FileList | File[]): Promise<string[]> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    const response = await firstValueFrom(this.api.post<{ success: boolean; urls: string[]; files: any[] }>('/upload', formData));
    return response.urls;
  }
}
