import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: string;
  createdAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
}


export interface MeResponse {
  success: boolean;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(
      `${this.apiUrl}/users`
    );
  }

  getMe(): Observable<MeResponse> {
  return this.http.get<MeResponse>(
    `${this.apiUrl}/auth/me`
  );
}
}
