import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'admin_auth_token';
  private authStatusSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  
  // Observable for real-time status updates in navbar, etc.
  public authStatus$ = this.authStatusSubject.asObservable();

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<{ success: boolean; token: string }> {
    return this.http.post<{ success: boolean; token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(res => {
          if (res && res.token) {
            localStorage.setItem(this.tokenKey, res.token);
            this.authStatusSubject.next(true);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.authStatusSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
