import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(
    email: string,
    password: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/login`,
        {
          email,
          password
        }
      )
      .pipe(
        tap((response: AuthResponse) => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem(
              'user',
              JSON.stringify(response.user)
            );
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}