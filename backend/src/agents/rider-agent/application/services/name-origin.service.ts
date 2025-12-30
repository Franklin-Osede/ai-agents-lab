import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface NameOriginResult {
  isAfrican: boolean;
  isAsian: boolean;
  isLatino: boolean;
  isCaucasian: boolean;
  confidence: number;
  topCountries: Array<{ country: string; probability: number }>;
}

/**
 * Service to validate name origin using external APIs
 * Currently uses Nationalize.io API (free tier)
 * Can be extended to support other APIs like Verrock
 */
@Injectable()
export class NameOriginService {
  private readonly logger = new Logger(NameOriginService.name);
  private readonly NATIONALIZE_API = 'https://api.nationalize.io';

  // African countries list (based on UN classification)
  private readonly AFRICAN_COUNTRIES = new Set([
    'NG', // Nigeria
    'ET', // Ethiopia
    'EG', // Egypt
    'ZA', // South Africa
    'KE', // Kenya
    'UG', // Uganda
    'GH', // Ghana
    'TZ', // Tanzania
    'DZ', // Algeria
    'SD', // Sudan
    'MA', // Morocco
    'AO', // Angola
    'MZ', // Mozambique
    'MG', // Madagascar
    'CM', // Cameroon
    'CI', // Côte d'Ivoire
    'NE', // Niger
    'BF', // Burkina Faso
    'ML', // Mali
    'MW', // Malawi
    'ZM', // Zambia
    'SN', // Senegal
    'TD', // Chad
    'SO', // Somalia
    'ZW', // Zimbabwe
    'GN', // Guinea
    'RW', // Rwanda
    'BJ', // Benin
    'BI', // Burundi
    'TN', // Tunisia
    'SS', // South Sudan
    'TG', // Togo
    'SL', // Sierra Leone
    'LY', // Libya
    'LR', // Liberia
    'MR', // Mauritania
    'ER', // Eritrea
    'GM', // Gambia
    'BW', // Botswana
    'GA', // Gabon
    'NA', // Namibia
    'GW', // Guinea-Bissau
    'MU', // Mauritius
    'SZ', // Eswatini
    'DJ', // Djibouti
    'RE', // Réunion
    'KM', // Comoros
    'CV', // Cape Verde
    'SC', // Seychelles
    'ST', // São Tomé and Príncipe
    'EH', // Western Sahara
  ]);

  // Asian countries
  private readonly ASIAN_COUNTRIES = new Set([
    'CN', // China
    'IN', // India
    'ID', // Indonesia
    'PK', // Pakistan
    'BD', // Bangladesh
    'JP', // Japan
    'PH', // Philippines
    'VN', // Vietnam
    'TH', // Thailand
    'MY', // Malaysia
    'MM', // Myanmar
    'KR', // South Korea
    'AF', // Afghanistan
    'NP', // Nepal
    'YE', // Yemen
    'IQ', // Iraq
    'SA', // Saudi Arabia
    'UZ', // Uzbekistan
    'KH', // Cambodia
    'LA', // Laos
    'SG', // Singapore
    'HK', // Hong Kong
    'TW', // Taiwan
    'MN', // Mongolia
    'KZ', // Kazakhstan
    'GE', // Georgia
    'AM', // Armenia
    'AZ', // Azerbaijan
    'LB', // Lebanon
    'JO', // Jordan
    'SY', // Syria
    'AE', // UAE
    'OM', // Oman
    'KW', // Kuwait
    'QA', // Qatar
    'BH', // Bahrain
    'BN', // Brunei
    'LK', // Sri Lanka
    'BT', // Bhutan
    'MV', // Maldives
    'TL', // East Timor
  ]);

  // Latino/Hispanic countries
  private readonly LATINO_COUNTRIES = new Set([
    'MX', // Mexico
    'BR', // Brazil
    'AR', // Argentina
    'CO', // Colombia
    'CL', // Chile
    'PE', // Peru
    'VE', // Venezuela
    'EC', // Ecuador
    'GT', // Guatemala
    'CU', // Cuba
    'BO', // Bolivia
    'DO', // Dominican Republic
    'HN', // Honduras
    'PY', // Paraguay
    'SV', // El Salvador
    'NI', // Nicaragua
    'CR', // Costa Rica
    'PA', // Panama
    'UY', // Uruguay
    'JM', // Jamaica
    'TT', // Trinidad and Tobago
    'GY', // Guyana
    'SR', // Suriname
    'BZ', // Belize
    'BS', // Bahamas
    'BB', // Barbados
    'LC', // Saint Lucia
    'GD', // Grenada
    'VC', // Saint Vincent
    'AG', // Antigua and Barbuda
    'DM', // Dominica
    'KN', // Saint Kitts and Nevis
    'ES', // Spain (also considered Latino/Hispanic)
    'PT', // Portugal
  ]);

  // Caucasian/European countries
  private readonly CAUCASIAN_COUNTRIES = new Set([
    'US', // United States (white population)
    'GB', // United Kingdom
    'DE', // Germany
    'FR', // France
    'IT', // Italy
    'PL', // Poland
    'NL', // Netherlands
    'BE', // Belgium
    'GR', // Greece
    'CZ', // Czech Republic
    'RO', // Romania
    'SE', // Sweden
    'HU', // Hungary
    'AT', // Austria
    'CH', // Switzerland
    'BG', // Bulgaria
    'DK', // Denmark
    'FI', // Finland
    'SK', // Slovakia
    'NO', // Norway
    'IE', // Ireland
    'HR', // Croatia
    'RS', // Serbia
    'LT', // Lithuania
    'SI', // Slovenia
    'LV', // Latvia
    'EE', // Estonia
    'CY', // Cyprus
    'LU', // Luxembourg
    'MT', // Malta
    'IS', // Iceland
    'AU', // Australia
    'NZ', // New Zealand
    'CA', // Canada
  ]);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Validates name origin using Nationalize.io API
   * Falls back to heuristics if API fails
   */
  async validateNameOrigin(name: string): Promise<NameOriginResult> {
    const firstName = this.extractFirstName(name);

    try {
      // Call Nationalize.io API
      const response = await firstValueFrom(
        this.httpService.get(`${this.NATIONALIZE_API}?name=${encodeURIComponent(firstName)}`),
      );

      const data = response.data;
      const countries = data.country || [];

      // Calculate probabilities for each category
      let africanProb = 0;
      let asianProb = 0;
      let latinoProb = 0;
      let caucasianProb = 0;

      const topCountries: Array<{ country: string; probability: number }> = [];

      countries.forEach((item: { country_id: string; probability: number }) => {
        const countryCode = item.country_id;
        const probability = item.probability;

        topCountries.push({ country: countryCode, probability });

        if (this.AFRICAN_COUNTRIES.has(countryCode)) {
          africanProb += probability;
        } else if (this.ASIAN_COUNTRIES.has(countryCode)) {
          asianProb += probability;
        } else if (this.LATINO_COUNTRIES.has(countryCode)) {
          latinoProb += probability;
        } else if (this.CAUCASIAN_COUNTRIES.has(countryCode)) {
          caucasianProb += probability;
        }
      });

      // Determine the most likely category
      const maxProb = Math.max(africanProb, asianProb, latinoProb, caucasianProb);
      const confidence = maxProb;

      this.logger.log(
        `Name "${firstName}" - African: ${africanProb.toFixed(2)}, Asian: ${asianProb.toFixed(2)}, Latino: ${latinoProb.toFixed(2)}, Caucasian: ${caucasianProb.toFixed(2)}`,
      );

      return {
        isAfrican:
          africanProb > 0.3 ||
          (africanProb > asianProb && africanProb > latinoProb && africanProb > caucasianProb),
        isAsian:
          asianProb > 0.3 ||
          (asianProb > africanProb && asianProb > latinoProb && asianProb > caucasianProb),
        isLatino:
          latinoProb > 0.3 ||
          (latinoProb > africanProb && latinoProb > asianProb && latinoProb > caucasianProb),
        isCaucasian:
          caucasianProb > 0.3 ||
          (caucasianProb > africanProb && caucasianProb > asianProb && caucasianProb > latinoProb),
        confidence,
        topCountries: topCountries.slice(0, 5),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to validate name origin for "${firstName}": ${error.message}. Falling back to heuristics.`,
      );
      // Fallback to heuristics
      return this.fallbackHeuristics(firstName);
    }
  }

  /**
   * Extract first name from full name
   */
  private extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || fullName;
  }

  /**
   * Fallback heuristics when API is unavailable
   */
  private fallbackHeuristics(name: string): NameOriginResult {
    const normalizedName = name.toLowerCase().trim();

    // African names
    const africanNames = [
      'franklin',
      'jamal',
      'tyrone',
      'malik',
      'dante',
      'kobe',
      'lebron',
      'omar',
      'kendrick',
      'darius',
      'marcus',
      'andre',
    ];
    const isAfrican = africanNames.some((n) => normalizedName.includes(n) || normalizedName === n);

    // Asian names
    const asianNames = [
      'hiro',
      'kenji',
      'wei',
      'lee',
      'jin',
      'akira',
      'tanaka',
      'chen',
      'wang',
      'li',
      'zhang',
      'kim',
    ];
    const isAsian = asianNames.some((n) => normalizedName.includes(n) || normalizedName === n);

    // Latino names
    const latinoNames = [
      'jose',
      'juan',
      'carlos',
      'luis',
      'miguel',
      'pedro',
      'jesus',
      'antonio',
      'raul',
      'julio',
      'ricardo',
      'fernando',
    ];
    const isLatino = latinoNames.some((n) => normalizedName.includes(n) || normalizedName === n);

    // Default to caucasian if none match
    const isCaucasian = !isAfrican && !isAsian && !isLatino;

    return {
      isAfrican,
      isAsian,
      isLatino,
      isCaucasian,
      confidence: isAfrican || isAsian || isLatino ? 0.7 : 0.5,
      topCountries: [],
    };
  }
}
