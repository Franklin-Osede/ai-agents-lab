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
  coverImage?: string;
  coverImageAlt?: string;
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
  coverImage?: string;
  coverImageAlt?: string;
  authorName?: string;
  status?: BlogPostStatus;
  seoTitle?: string;
  seoDescription?: string;
}

export const BLOG_AUTHORS = [
  { id: 'miguel_h', name: 'Miguel H.', role: 'Head of Growth', avatar: 'https://ui-avatars.com/api/?name=Miguel+H&background=eff6ff&color=1d4ed8&size=120&font-size=0.33&bold=true' },
  { id: 'elena_r', name: 'Elena R.', role: 'Médico Especialista', avatar: 'https://ui-avatars.com/api/?name=Elena+R&background=0D8ABC&color=fff&size=120&font-size=0.33&bold=true' },
  { id: 'carlos_m', name: 'Carlos M.', role: 'CEO & Founder', avatar: 'https://ui-avatars.com/api/?name=Carlos+M&background=f0fdf4&color=166534&size=120&font-size=0.33&bold=true' },
  { id: 'ana_g', name: 'Ana G.', role: 'Directora Médica', avatar: 'https://ui-avatars.com/api/?name=Ana+G&background=fdf2f8&color=be185d&size=120&font-size=0.33&bold=true' }
];

export function getAuthorDetails(authorIdOrName?: string) {
  if (!authorIdOrName) return BLOG_AUTHORS[1];
  const author = BLOG_AUTHORS.find(a => a.id === authorIdOrName || a.name === authorIdOrName);
  return author || BLOG_AUTHORS[1];
}
