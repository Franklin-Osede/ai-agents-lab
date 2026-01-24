export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  screenshot?: string;
  branding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    businessName?: string;
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
    services?: string[];
    navbarSections?: Array<{ name: string; items?: string[] }>;
    insurance?: string[];
  };
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
    hours?: string;
  };
  team?: Array<{ name: string; role: string; image: string }>;
  blogPosts?: Array<{ title: string; url: string; date?: string; summary?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  testimonials?: string[];
}

export abstract class IScraperService {
  abstract scrapeUrl(url: string): Promise<ScrapedPage>;
}
