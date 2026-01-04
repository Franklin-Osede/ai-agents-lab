export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  rawHtml?: string;
}

export abstract class IScraperService {
  abstract scrapeUrl(url: string): Promise<ScrapedPage>;
}
