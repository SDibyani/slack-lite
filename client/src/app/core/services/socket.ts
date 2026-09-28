import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket | null = null;
  private messageListeners: ((message: any) => void)[] = [];
  private typingListeners: ((data: any) => void)[] = [];
  private stopTypingListeners: ((data: any) => void)[] = [];
  private unreadUpdateListeners: ((data: any) => void)[] = [];
  private onlineStatusListeners: ((data: any) => void)[] = [];
  private messageReadListeners: ((data: { messageId: string; readBy: string[] }) => void)[] = [];

  connect(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Socket connection failed: token not found');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      // Re-register all listeners upon reconnect
      this.messageListeners.forEach(cb => this.socket?.on('new_message', cb));
      this.typingListeners.forEach(cb => this.socket?.on('user_typing', cb));
      this.stopTypingListeners.forEach(cb => this.socket?.on('user_stop_typing', cb));
      this.messageReadListeners.forEach(cb => this.socket?.on('message_read', cb));
      this.unreadUpdateListeners.forEach(cb => this.socket?.on('unread_update', cb));
      this.onlineStatusListeners.forEach(cb => this.socket?.on('user_online', cb));
      this.onlineStatusListeners.forEach(cb => this.socket?.on('user_offline', cb));
    });

    this.socket.on('connect_error', (error) => {
      console.error('SOCKET CONNECTION ERROR:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SOCKET DISCONNECTED:', reason);
    });

    this.socket.on('socket_error', (error) => {
      console.error('SOCKET ERROR:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onNewMessage(callback: (message: any) => void): void {
    this.messageListeners.push(callback);
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onTyping(callback: (data: { userId: string; name: string; conversationId?: string }) => void): void {
    this.typingListeners.push(callback);
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onStopTyping(callback: (data: { userId: string; conversationId?: string }) => void): void {
    this.stopTypingListeners.push(callback);
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  onMessageRead(callback: (data: { messageId: string; readBy: string[] }) => void): void {
    this.messageReadListeners.push(callback);
    if (this.socket) {
      this.socket.on('message_read', callback);
    }
  }

  onUnreadUpdate(callback: (data: any) => void): void {
    this.unreadUpdateListeners.push(callback);
    if (this.socket) {
      this.socket.on('unread_update', callback);
    }
  }

  onUserStatusUpdate(callback: (data: any) => void): void {
    this.onlineStatusListeners.push(callback);
    if (this.socket) {
      this.socket.on('user_online', callback);
      this.socket.on('user_offline', callback);
    }
  }
}
