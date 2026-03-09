import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../shared/services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    // Check if already logged in
    this.supabase.user$.subscribe(user => {
      if (user) {
        this.router.navigate(['/blog/admin']);
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const email = this.loginForm.value.email;

    try {
      const { error } = await this.supabase.signInWithMagicLink(email);
      if (error) throw error;
      
      // If dev bypass happened, it won't throw error and will auto redirect. 
      // If it's a real magic link, show message.
      if (email !== 'admin@admin.com') {
        this.successMsg = '¡Revisa tu correo! Te hemos enviado un Magic Link para acceder.';
      }
    } catch (error: any) {
      this.errorMsg = error.message || 'Error al intentar iniciar sesión.';
    } finally {
      this.loading = false;
    }
  }
}
