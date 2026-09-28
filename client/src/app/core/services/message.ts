import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
}

export interface Message {
  _id: string;
  conversation: string;
  sender: MessageSender;
  content: string;
  type: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  attachment?: {
    url: string;
    name: string;
    size: number;
  };
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMessages(
    conversationId: string
  ): Observable<MessagesResponse> {

    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/messages/${conversationId}`
    );

  }

  sendMessage(
  conversationId: string,
  content: string
): Observable<SendMessageResponse> {

  return this.http.post<SendMessageResponse>(
    `${this.apiUrl}/messages`,
    {
      conversationId,
      content,
      type: 'text'
    }
  );

}

markAsRead(messageId: string): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/messages/${messageId}/read`,
    {}
  );
}

markMessageAsRead(messageId: string): Observable<any> {
  return this.http.put<any>(
    `${this.apiUrl}/messages/${messageId}/read`,
    {}
  );
}
}
