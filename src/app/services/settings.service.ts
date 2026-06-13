import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiBaseUrl}/settings`;

  constructor(private http: HttpClient) { }

  getSettings(): Observable<{ success: boolean; data: { [key: string]: string } }> {
    return this.http.get<{ success: boolean; data: { [key: string]: string } }>(this.apiUrl);
  }

  updateSetting(key: string, value: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(this.apiUrl, { key, value });
  }
}
