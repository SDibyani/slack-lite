import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import {
  CommonModule,
  DatePipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user';
import {
  ConversationService,
  Conversation
} from '../../../core/services/conversation';
import {
  MessageService,
  Message
} from '../../../core/services/message';
import { SocketService } from '../../../core/services/socket';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [  CommonModule,
  DatePipe,
  FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})

export class Chat implements OnInit {

  users: User[] = [];

  conversations: Conversation[] = [];

  selectedUser: User | null = null;

  selectedConversation: Conversation | null = null;

  loadingUsers = true;
  loadingConversations = true;

  errorMessage = '';

 chatMessages: Message[] = [];

 messageText = '';
sendingMessage = false;
isTyping = false;
typingUserName = '';
private typingTimeout: any;
loadingMessages = false;
messageError = '';

showCreateGroup = false;

groupName = '';

selectedGroupMembers: string[] = [];
unreadCounts: { [conversationId: string]: number } = {};

creatingGroup = false;

groupError = '';

showGroupMembers = false;
addingMember = false;
memberError = '';
currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private conversationService: ConversationService,
     private messageService: MessageService,
     private socketService: SocketService,
     private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

  this.socketService.connect();
setTimeout(() => {
  this.listenForNewMessages();
  this.listenForTyping();
  this.listenForMessageRead();
  this.listenForUnreadUpdates();
  this.listenForUserStatus();
}, 500);

 this.loadCurrentUser();

  this.loadUsers();
  this.loadConversations();

}



  loadUsers(): void {

    this.loadingUsers = true;

    this.userService.getUsers().subscribe({

      next: (response) => {

        this.loadingUsers = false;

        if (response.success) {

          this.users = response.users;

          if (this.users.length > 0) {
            this.selectedUser = this.users[0];
          }

        }

      },

      error: (error) => {

        console.error('USERS API ERROR:', error);

        this.loadingUsers = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to load users.';

      }

    });

  }


loadConversations(): void {
    this.conversationService.getConversations().subscribe({
      next: (response) => {
        this.conversations = response.conversations || [];
        this.conversations.forEach(conv => {
          this.unreadCounts[conv._id] = conv.unreadCount || 0;
        });
        this.loadingConversations = false;

      if (this.conversations.length > 0) {

  this.selectedConversation =
    this.conversations[0];

  this.joinConversationRoom(
    this.selectedConversation._id
  );

  this.loadMessages(
    this.selectedConversation._id
  );
}

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('CONVERSATIONS ERROR:', error);
        this.loadingConversations = false;
        this.cdr.detectChanges();
      }
    });
  }



  selectUser(user: User): void {

    this.selectedUser = user;

    const conversation =
      this.conversations.find(
        conversation =>
          conversation.type === 'direct' &&
          conversation.participants.some(
            participant =>
              participant._id === user.id
          )
      );

    this.selectedConversation =
      conversation || null;

      if (this.selectedConversation) {
  this.unreadCounts[this.selectedConversation._id] = 0;
}

  }

selectConversation(conversation: Conversation): void {
  this.isTyping = false;
  this.typingUserName = '';

  this.selectedConversation = conversation;
  this.unreadCounts[conversation._id] = 0;

  this.joinConversationRoom(conversation._id);
  this.loadMessages(conversation._id);

  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      participant => participant._id !== this.getCurrentUserId()
    );

    if (otherParticipant) {
      this.selectedUser = {
        id: otherParticipant._id,
        name: otherParticipant.name,
        email: otherParticipant.email,
        avatar: otherParticipant.avatar,
        status: otherParticipant.status,
        lastSeen: otherParticipant.lastSeen,
        createdAt: ''
      };
    }
  }
  
  this.cdr.detectChanges();
}

  getCurrentUserId(): string {

    const user =
      localStorage.getItem('user');

    if (!user) {
      return '';
    }

    try {

      const parsedUser = JSON.parse(user);

      return parsedUser.id ||
             parsedUser._id ||
             '';

    } catch {

      return '';

    }

  }

  getInitials(name: string): string {

    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();

  }


  
getConversationName(
  conversation: Conversation
): string {

  if (conversation.type === 'group') {
    return conversation.name;
  }

  const currentUserId =
    this.getCurrentUserId();

  const otherUser =
    conversation.participants.find(
      participant =>
        participant._id !== currentUserId
    );

  return otherUser?.name ||
         conversation.participants[0]?.name ||
         'Unknown User';
}



loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.messageError = '';
    this.chatMessages = [];

    this.unreadCounts[conversationId] = 0;

    this.messageService.getMessages(conversationId).subscribe({
      next: (response) => {
        if (response.success) {
          this.chatMessages = response.messages || [];

          this.chatMessages.forEach(message => {
    this.markMessageAsRead(message);
  });
        } else {
          this.chatMessages = [];
        }
        this.loadingMessages = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('MESSAGES ERROR:', error);
        this.chatMessages = [];
        this.loadingMessages = false;
        this.messageError = error?.error?.message || 'Unable to load messages.';
        this.cdr.detectChanges();
      }
    });
  }

sendMessage(): void {

  const content = this.messageText.trim();

  if (!content) {
    return;
  }

  if (!this.selectedConversation) {
    return;
  }

  if (this.sendingMessage) {
    return;
  }

  const conversationId =
    this.selectedConversation._id;

  const socket =
    this.socketService.getSocket();

  if (!socket || !socket.connected) {
    console.error(
      'SOCKET NOT CONNECTED'
    );

    this.messageError =
      'Connection lost. Please try again.';

    return;
  }

  this.sendingMessage = true;

  socket.emit('send_message', {
    conversationId,
    content,
    type: 'text'
  });

  this.messageText = '';

  this.sendingMessage = false;

}


joinConversationRoom(conversationId: string): void {

  const socket = this.socketService.getSocket();

  if (!socket) {
    console.error('Socket is not connected');
    return;
  }

  socket.emit(
    'join_conversation',
    conversationId
  );
}
listenForNewMessages(): void {

  this.socketService.onNewMessage(
    (message: Message) => {

      if (
         this.selectedConversation?._id !==
         message.conversation
       ) {

        const conversation =
          this.conversations.find(
            c => c._id === message.conversation
          );

        if (conversation) {
          conversation.lastMessage = {
            _id: message._id,
            sender: message.sender._id,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt
          } as any;

          conversation.lastMessageAt = message.createdAt;
        }

        this.cdr.detectChanges();

        return;
      }

      const exists = this.chatMessages.some(
        existing => existing._id === message._id
      );

      if (exists) {
        return;
      }

      this.chatMessages = [
        ...this.chatMessages,
        message
      ];

      if (message.sender?._id !== this.getCurrentUserId()) {
        this.markMessageAsRead(message);
      }

      const conversation = this.conversations.find(
        c => c._id === message.conversation
      );

      if (conversation) {
        conversation.lastMessage = {
          _id: message._id,
          sender: message.sender._id,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt
        } as any;

        conversation.lastMessageAt = message.createdAt;
      }

      this.cdr.detectChanges();
    }
  );
}

onMessageTyping(): void {
  if (!this.selectedConversation) {
    return;
  }

  const socket = this.socketService.getSocket();

  if (!socket || !socket.connected) {
    return;
  }

  const conversationId =
    this.selectedConversation._id;

  socket.emit(
    'typing',
    conversationId
  );

  clearTimeout(this.typingTimeout);

  this.typingTimeout = setTimeout(() => {

    socket.emit(
      'stop_typing',
      conversationId
    );

  }, 1000);
}



listenForTyping(): void {
  this.socketService.onTyping((data: any) => {
    if (data.userId === this.getCurrentUserId()) {
      return;
    }

    if (data.conversationId && data.conversationId !== this.selectedConversation?._id) {
      return;
    }

    this.typingUserName = data.name || data.userName || 'Someone';
    this.isTyping = true;

    this.cdr.detectChanges();
  });

  this.socketService.onStopTyping((data: any) => {
    if (data.userId === this.getCurrentUserId()) {
      return;
    }

    if (data.conversationId && data.conversationId !== this.selectedConversation?._id) {
      return;
    }

    this.isTyping = false;
    this.typingUserName = '';

    this.cdr.detectChanges();
  });
}




  listenForMessageRead(): void {
    this.socketService.onMessageRead((data: { messageId: string; readBy: string[] }) => {
      const message = this.chatMessages.find(m => m._id === data.messageId);
      if (message) {
        message.readBy = data.readBy;
        this.cdr.detectChanges();
      }
    });
  }

  listenForUnreadUpdates(): void {
    this.socketService.onUnreadUpdate((data: any) => {
      if (this.selectedConversation?._id !== data.conversationId) {
        this.unreadCounts[data.conversationId] =
          (this.unreadCounts[data.conversationId] || 0) + 1;

        const conversation =
          this.conversations.find(
            c => c._id === data.conversationId
          );

        if (conversation) {
          conversation.lastMessage = {
            _id: '',
            sender: data.senderId || '',
            content: data.content || '',
            type: 'text',
            createdAt: data.createdAt || new Date().toISOString()
          } as any;

          conversation.lastMessageAt =
            data.createdAt || new Date().toISOString();
        }

        this.cdr.detectChanges();
      }
    });
  }

  listenForUserStatus(): void {
    this.socketService.onUserStatusUpdate((data: any) => {
      const userId = data.userId?.toString();
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.status = data.status;
        if (data.lastSeen) {
          user.lastSeen = data.lastSeen;
        }
        this.cdr.detectChanges();
      }
    });
  }

  markMessageAsRead(message: Message): void {

  const currentUserId = this.getCurrentUserId();

  if (!currentUserId) {
    return;
  }

  
  if (message.readBy?.includes(currentUserId)) {
    return;
  }

  this.messageService
    .markMessageAsRead(message._id)
    .subscribe({
      next: () => {

       
        message.readBy = [
          ...(message.readBy || []),
          currentUserId
        ];

        this.cdr.detectChanges();

      },

      error: (error) => {
        console.error(
          'MARK MESSAGE READ ERROR:',
          error
        );
      }
    });
}


startConversation(user: User): void {
  this.conversationService
    .startConversation(user.id)
    .subscribe({

      next: (response) => {
        if (!response.success) {
          return;
        }

        const conversation = response.conversation;

        const existingIndex =
          this.conversations.findIndex(
            item => item._id === conversation._id
          );

        if (existingIndex === -1) {
          this.conversations = [
            conversation,
            ...this.conversations
          ];

        } else {
          this.conversations[existingIndex] =
            conversation;
        }

        this.selectedConversation =
          conversation;

        this.unreadCounts[conversation._id] = 0;

        this.selectedUser = user;

        this.joinConversationRoom(
          conversation._id
        );

       
        this.loadMessages(
          conversation._id
        );

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'START CONVERSATION ERROR:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          'Unable to start conversation.';
      }

    });
}

toggleGroupMember(userId: string): void {

  if (this.selectedGroupMembers.includes(userId)) {

    this.selectedGroupMembers =
      this.selectedGroupMembers.filter(
        id => id !== userId
      );

  } else {

    this.selectedGroupMembers = [
      ...this.selectedGroupMembers,
      userId
    ];

  }

}

createGroup(): void {

  if (!this.groupName.trim()) {
    this.groupError = 'Enter a group name.';
    return;
  }

  if (this.selectedGroupMembers.length === 0) {
    this.groupError = 'Select at least one member.';
    return;
  }

  if (this.creatingGroup) {
    return;
  }

  this.creatingGroup = true;
  this.groupError = '';

  this.conversationService
    .createGroup(
      this.groupName.trim(),
      this.selectedGroupMembers
    )
    .subscribe({

      next: (response) => {

        if (response.success) {

          
          this.conversations = [
            response.conversation,
            ...this.conversations
          ];

          this.selectedConversation =
            response.conversation;

            this.unreadCounts[response.conversation._id] = 0;

          this.joinConversationRoom(
            response.conversation._id
          );

          
          this.loadMessages(
            response.conversation._id
          );

        
          this.showCreateGroup = false;
          this.groupName = '';
          this.selectedGroupMembers = [];
          this.groupError = '';
        }

        this.creatingGroup = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'CREATE GROUP ERROR:',
          error
        );

        this.groupError =
          error?.error?.message ||
          'Failed to create group.';

        this.creatingGroup = false;

        this.cdr.detectChanges();
      }

    });

}

toggleGroupMembers(): void {
  this.showGroupMembers = !this.showGroupMembers;
}

addGroupMember(user: User): void {

  if (!this.selectedConversation) {
    return;
  }

  if (this.selectedConversation.type !== 'group') {
    return;
  }

  this.addingMember = true;
  this.memberError = '';

  this.conversationService
    .addGroupMember(
      this.selectedConversation._id,
      user.id
    )
    .subscribe({

      next: (response) => {

        if (response.success) {

        
          this.selectedConversation =
            response.conversation;

                    const index =
            this.conversations.findIndex(
              conversation =>
                conversation._id ===
                response.conversation._id
            );

          if (index !== -1) {
            this.conversations[index] =
              response.conversation;
          }

          this.cdr.detectChanges();
        }

        this.addingMember = false;
      },

      error: (error) => {

        console.error(
          'ADD GROUP MEMBER ERROR:',
          error
        );

        this.memberError =
          error?.error?.message ||
          'Unable to add member.';

        this.addingMember = false;

        this.cdr.detectChanges();
      }

    });
}
loadCurrentUser(): void {

  this.userService.getMe().subscribe({

    next: (response) => {
      if (response.success) {
        this.currentUser = response.user;
      }

      this.cdr.detectChanges();

    },

    error: (error) => {

      console.error('GET ME ERROR:', error);

    }

  });

}


  trackByFn(index: number, item: any): string {
    return item._id || index;
  }
}

