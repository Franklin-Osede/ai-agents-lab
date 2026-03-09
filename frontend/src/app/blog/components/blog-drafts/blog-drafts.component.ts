import { Component, OnInit, inject } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { BlogPost, BlogPostStatus } from '../../models/blog.model';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { Router } from '@angular/router';

import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog-drafts',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './blog-drafts.component.html'
})
export class BlogDraftsComponent implements OnInit {
  posts: BlogPost[] = [];
  loading = true;
  userEmail = '';
  currentTab: 'drafts' | 'published' | 'trashed' = 'drafts';

  private blogService = inject(BlogService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  ngOnInit() {
    this.loadPosts();
    this.supabase.user$.subscribe(user => {
      this.userEmail = user?.email || '';
    });
  }

  setTab(tab: 'drafts' | 'published' | 'trashed') {
    this.currentTab = tab;
    this.loadPosts();
  }

  loadPosts() {
     this.loading = true;
     let request;
     if (this.currentTab === 'drafts') request = this.blogService.getDraftPosts();
     else if (this.currentTab === 'published') request = this.blogService.getPublishedPosts();
     else request = this.blogService.getTrashedPosts();

     request.subscribe({
       next: (data) => {
         this.posts = data;
         this.loading = false;
       },
       error: (err) => {
         console.error('Error fetching posts', err);
         this.loading = false;
       }
     });
  }

  publish(id: string) {
     if (confirm('¿Estás seguro de que quieres publicar este artículo?')) {
        this.blogService.publishDraft(id).subscribe({
           next: () => {
             this.posts = this.posts.filter(d => d.id !== id);
             alert('Artículo publicado exitosamente.');
           },
           error: (err) => {
             console.error('Error publishing post', err);
             alert('Hubo un error al publicar el artículo.');
           }
        });
     }
  }

  moveToTrash(id: string) {
     if (confirm('¿Estás seguro de mover a la papelera este artículo?')) {
        this.blogService.moveToTrash(id).subscribe({
           next: () => {
             this.posts = this.posts.filter(d => d.id !== id);
           },
           error: (err) => {
             console.error('Error moving post to trash', err);
             alert('Hubo un error al mover el artículo a la papelera.');
           }
        });
     }
  }


  async logout() {
     await this.supabase.signOut();
     this.router.navigate(['/login']);
  }
}
