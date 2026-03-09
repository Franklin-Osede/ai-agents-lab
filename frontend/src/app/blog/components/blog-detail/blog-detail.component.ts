import { Component, OnInit, inject, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { BlogPost, getAuthorDetails } from '../../models/blog.model';

import { CommonModule, DatePipe, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, SafeHtmlPipe],
  templateUrl: './blog-detail.component.html'
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | null = null;
  loading = true;
  getAuthor = getAuthorDetails;

  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.fetchPost(slug);
      }
    });
  }

  fetchPost(slug: string) {
    this.loading = true;
    this.blogService.getPostBySlug(slug).subscribe({
      next: (data) => {
        this.post = data;
        this.loading = false;
        this.injectJsonLd();
      },
      error: (err) => {
        console.error('Error fetching blog post', err);
        this.loading = false;
      }
    });
  }

  private injectJsonLd() {
    if (!this.post) return;

    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    
    // Create standard Schema.org BlogPosting schema
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${this.document.location.origin}/blog/${this.post.slug}`
      },
      "headline": this.post.title,
      "datePublished": this.post.createdAt,
      "dateModified": this.post.updatedAt,
      "author": {
        "@type": "Person",
        "name": this.getAuthor(this.post.authorName).name
      },
      "description": this.post.content.replace(/<[^>]*>?/gm, '').substring(0, 160) // Strip HTML for meta desc
    };

    script.text = JSON.stringify(jsonLd);
    
    // Basic cleanup logic to prevent duplicate scripts if navigating rapidly
    const existingScript = this.document.head.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      this.renderer.removeChild(this.document.head, existingScript);
    }
    
    this.renderer.appendChild(this.document.head, script);
  }
}
