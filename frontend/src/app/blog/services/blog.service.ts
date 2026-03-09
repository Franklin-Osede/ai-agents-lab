import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlogPost, CreateBlogPostDto } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/blog`;

  getPublishedPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(this.apiUrl);
  }

  getDraftPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.apiUrl}/drafts`);
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/${slug}`);
  }

  createPost(data: CreateBlogPostDto): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.apiUrl, data);
  }

  publishDraft(id: string): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.apiUrl}/${id}`, { status: 'published' });
  }

  moveToTrash(id: string): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.apiUrl}/${id}`, { status: 'trashed' });
  }

  getTrashedPosts(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.apiUrl}?status=trashed`);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
