import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  @Input() preselectedRole: 'professional' | 'client' | null = null;
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<void>();

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: 'professional' | 'client' = 'client';
  acceptTerms = false;
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.preselectedRole) {
      this.role = this.preselectedRole;
    }
  }

  onSubmit(): void {
    // Validation
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate async operation
    setTimeout(() => {
      const result = this.authService.register(
        this.email,
        this.password,
        this.name,
        this.role
      );

      if (result.success) {
        this.registerSuccess.emit();
      } else {
        this.errorMessage = result.error || 'Error al registrarse';
      }

      this.isLoading = false;
    }, 500);
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }

  onGoogleSignUp(): void {
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

      // Register with Google (use preselected role if available)
      const result = this.authService.register(
        googleUser.email,
        'google_oauth_' + googleUser.email,
        googleUser.name,
        this.preselectedRole || this.role
      );

      if (result.success) {
        this.registerSuccess.emit();
      } else {
        // User might already exist, try to login
        const loginResult = this.authService.login(googleUser.email, 'google_oauth_' + googleUser.email);
        if (loginResult.success) {
          this.registerSuccess.emit();
        } else {
          this.errorMessage = result.error || 'Error al registrarse con Google';
        }
      }

      this.isLoading = false;
    }, 800);
  }
}
