import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Chat } from './features/chat/chat/chat';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  {
    path: 'chat',
    component: Chat,
    canActivate: [authGuard]
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];