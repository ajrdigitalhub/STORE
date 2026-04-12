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
    return response.url;
  }
}
