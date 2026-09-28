
import { User } from './user.model';

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  participants: User[];
  admins: User[];
  createdBy: string;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  attachment: {
    url: string;
    name: string;
    size: number;
  };
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}