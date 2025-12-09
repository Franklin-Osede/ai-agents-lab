import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @Output() switchToRegister = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate async operation
    setTimeout(() => {
      const result = this.authService.login(this.email, this.password);

      if (result.success) {
        this.loginSuccess.emit();
      } else {
        this.errorMessage = result.error || 'Error al iniciar sesión';
      }

      this.isLoading = false;
    }, 500);
  }

  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }

  onGoogleLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Simulate Google OAuth popup
    const userEmail = prompt('🔑 Simulación de Google OAuth\n\nIngresa tu email de Google:', 'usuario@gmail.com');
    
    if (!userEmail) {
      this.isLoading = false;
      return;
    }

    // Simulate OAuth delay
    setTimeout(() => {
      const googleUser = {
        email: userEmail,
        name: userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1),
      };

      // Try to login with Google email
      const result = this.authService.login(googleUser.email, 'google_oauth_' + googleUser.email);
      
      if (!result.success) {
        // User doesn't exist, auto-register them
        const registerResult = this.authService.register(
          googleUser.email,
          'google_oauth_' + googleUser.email,
          googleUser.name,
          'client' // Default to client role for Google sign-in
        );
        
        if (registerResult.success) {
          this.loginSuccess.emit();
        } else {
          this.errorMessage = 'Error al iniciar sesión con Google';
        }
      } else {
        this.loginSuccess.emit();
      }

      this.isLoading = false;
    }, 800);
  }
}
