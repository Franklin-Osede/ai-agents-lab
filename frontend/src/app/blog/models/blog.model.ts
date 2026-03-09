export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  TRASHED = 'trashed',
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorName?: string;
  status: BlogPostStatus;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlogPostDto {
  title: string;
  content: string;
  authorName?: string;
  status?: BlogPostStatus;
  seoTitle?: string;
  seoDescription?: string;
}
