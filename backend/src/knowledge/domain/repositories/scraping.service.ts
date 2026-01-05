export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  rawHtml?: string;
  screenshot?: string; // Base64
  logoUrl?: string;
  styles?: {
    primaryColor?: string;
  };
}

export abstract class IScraperService {
  abstract scrapeUrl(url: string): Promise<ScrapedPage>;
}
