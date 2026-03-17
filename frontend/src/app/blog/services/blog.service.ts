import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BlogPost, CreateBlogPostDto } from '../models/blog.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/blog`;

  getPublishedPosts(): Observable<BlogPost[]> {
    return this.http.get<ApiResponse<BlogPost[]>>(this.apiUrl).pipe(map(res => res.data));
  }

  getDraftPosts(): Observable<BlogPost[]> {
    return this.http.get<ApiResponse<BlogPost[]>>(`${this.apiUrl}/drafts`).pipe(map(res => res.data));
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<ApiResponse<BlogPost>>(`${this.apiUrl}/${slug}`).pipe(map(res => res.data));
  }

  createPost(data: CreateBlogPostDto): Observable<BlogPost> {
    return this.http.post<ApiResponse<BlogPost>>(this.apiUrl, data).pipe(map(res => res.data));
  }

  publishDraft(id: string): Observable<BlogPost> {
    return this.http.patch<ApiResponse<BlogPost>>(`${this.apiUrl}/${id}`, { status: 'published' }).pipe(map(res => res.data));
  }

  moveToTrash(id: string): Observable<BlogPost> {
    return this.http.patch<ApiResponse<BlogPost>>(`${this.apiUrl}/${id}`, { status: 'trashed' }).pipe(map(res => res.data));
  }

  getTrashedPosts(): Observable<BlogPost[]> {
    return this.http.get<ApiResponse<BlogPost[]>>(`${this.apiUrl}?status=trashed`).pipe(map(res => res.data));
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(res => res.data));
  }
}
