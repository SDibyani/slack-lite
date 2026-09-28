
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: string;
  createdAt: string;
}