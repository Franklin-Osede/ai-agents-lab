import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.scss'],
})
export class UrlInputComponent implements OnInit {
  niche = signal('');
  url = signal('');
  isLoading = signal(false);
  error = signal('');

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.niche.set(params['niche'] || '');
    });
  }

  isValidUrl(): boolean {
    try {
      const urlObj = new URL(this.url());
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onSubmit() {
    if (!this.isValidUrl()) {
      this.error.set('Por favor, introduce una URL válida');
      return;
    }

    this.error.set('');
    this.isLoading.set(true);

    // Navigate to training screen with URL as query param
    this.router.navigate(['/booking', this.niche(), 'training'], {
      queryParams: {
        url: this.url(),
      },
    });
  }

  useDemoData() {
    this.url.set('https://example.com');
    this.onSubmit();
  }

  goBack() {
    this.router.navigate(['/booking', 'select-niche']);
  }
}
