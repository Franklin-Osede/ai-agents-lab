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
  };
  team?: Array<{ name: string; role: string; image: string }>;
}

export abstract class IScraperService {
  abstract scrapeUrl(url: string): Promise<ScrapedPage>;
}
