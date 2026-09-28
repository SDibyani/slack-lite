import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, AuthResponse } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;

        if (response.success) {
          this.router.navigate(['/chat']);
        }
      },

      error: (error: any) => {
        this.loading = false;

        this.errorMessage =
          error?.error?.message ||
          'Invalid email or password.';
      }
    });
  }
}