import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConversationParticipant {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface LastMessage {
  _id: string;
  sender: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  participants: ConversationParticipant[];
  admins: string[];
  createdBy: string;
  lastMessage: LastMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface CreateGroupResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
}

export interface AddMemberResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(
      `${this.apiUrl}/conversations`
    );
  }


  startConversation(userId: string): Observable<{
  success: boolean;
  message: string;
  conversation: Conversation;
}> {
  return this.http.post<{
    success: boolean;
    message: string;
    conversation: Conversation;
  }>(
    `${this.apiUrl}/conversations/direct`,
    { userId }
  );
}


createGroup(
  name: string,
  participantIds: string[]
): Observable<CreateGroupResponse> {

  return this.http.post<CreateGroupResponse>(
    `${this.apiUrl}/conversations/group`,
    {
      name,
      participantIds
    }
  );
}

addGroupMember(
  conversationId: string,
  userId: string
): Observable<AddMemberResponse> {

  return this.http.post<AddMemberResponse>(
    `${this.apiUrl}/conversations/${conversationId}/members`,
    { userId }
  );
}


}
