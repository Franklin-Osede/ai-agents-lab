import { Component, OnInit, inject } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../models/blog.model';

import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './blog-list.component.html'
})
export class BlogListComponent implements OnInit {
  posts: BlogPost[] = [];
  loading = true;

  private blogService = inject(BlogService);

  ngOnInit() {
    this.blogService.getPublishedPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching blog posts', err);
        this.loading = false;
      }
    });
  }
}
