import { Injectable, Logger } from '@nestjs/common';
import { NameOriginService } from './name-origin.service';

export interface RiderProfile {
  profileImageUrl: string;
  vehicleDesc: string;
}

@Injectable()
export class RiderProfileFactory {
  private readonly logger = new Logger(RiderProfileFactory.name);

  // Curated list of images by approximate demographic/vibe
  // Using Unsplash source URLs for reliability
  private readonly profiles = {
    african_male: [
      'https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1572561300721-f8aa99066668?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    ],
    asian_male: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    ],
    latino_male: [
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1557862921-37829c790f19?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    ],
    caucasian_male: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    ],
    female_generic: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    ],
  };

  private readonly vehicles = [
    'Toyota Prius (Gris)',
    'Honda Civic (Negro)',
    'Yamaha NMAX (Azul)',
    'Ford Fiesta (Blanco)',
  ];

  constructor(private readonly nameOriginService: NameOriginService) {}

  /**
   * Generates a profile based on name validation using external API
   * Falls back to heuristics if API is unavailable
   *
   * Note: For names common in African-American communities (like Franklin),
   * we use heuristics first, then validate with API as secondary check
   */
  async generateProfile(name: string): Promise<RiderProfile> {
    const normalizedName = name.toLowerCase().trim();
    let category: keyof typeof this.profiles = 'caucasian_male'; // default

    // First, check heuristics for known African-American names
    // This is important because APIs may not correctly identify these names
    const heuristicCategory = this.determineCategoryFromHeuristics(normalizedName);

    // Check for female names (heuristic-based, as API doesn't provide gender)
    if (this.isFemaleName(normalizedName)) {
      category = 'female_generic';
    } else {
      // If heuristics suggest African-American name, use it
      // Otherwise, try API validation
      if (heuristicCategory === 'african_male') {
        category = 'african_male';
        this.logger.log(
          `Using heuristics for "${name}": ${category} (known African-American name)`,
        );
      } else {
        try {
          // Use API to validate name origin
          const originResult = await this.nameOriginService.validateNameOrigin(name);

          this.logger.log(
            `Name origin validation for "${name}": African=${originResult.isAfrican}, Asian=${originResult.isAsian}, Latino=${originResult.isLatino}, Caucasian=${originResult.isCaucasian}, Confidence=${originResult.confidence.toFixed(2)}`,
          );

          // Determine category based on API result
          if (originResult.isAfrican) {
            category = 'african_male';
          } else if (originResult.isAsian) {
            category = 'asian_male';
          } else if (originResult.isLatino) {
            category = 'latino_male';
          } else if (originResult.isCaucasian) {
            category = 'caucasian_male';
          } else {
            // Fallback to heuristics if API doesn't provide clear result
            category = heuristicCategory as keyof typeof this.profiles;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Failed to validate name origin for "${name}": ${errorMessage}. Using heuristics.`,
          );
          // Fallback to heuristics
          category = heuristicCategory as keyof typeof this.profiles;
        }
      }
    }

    // Pick random image from category
    const images = this.profiles[category];
    const image = images[Math.floor(Math.random() * images.length)];

    // Pick random vehicle
    const vehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];

    this.logger.log(`Generated profile for "${name}": ${category}`);

    return {
      profileImageUrl: image,
      vehicleDesc: vehicle,
    };
  }

  /**
   * Fallback heuristics when API is unavailable
   * Also used as primary check for known African-American names
   */
  private determineCategoryFromHeuristics(normalizedName: string): keyof typeof this.profiles {
    // African-American names (common names in African-American communities)
    // These are checked first because APIs may not correctly identify them
    if (
      this.matches(normalizedName, [
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
        'andre',
        'kenneth',
        'kevin',
        'terrance',
        'terrence',
        'derrick',
        'derek',
        'jermaine',
        'jermaine',
        'lamar',
        'shawn',
        'sean',
        'tyrell',
        'tyrese',
        'deandre',
        'deandre',
        'jalen',
        'jordan',
        'kareem',
        'khalil',
        'mohammed',
        'ahmad',
        'ahmed',
        'ibrahim',
        'abdul',
        'hassan',
        'ali',
      ])
    ) {
      return 'african_male';
    }

    // Asian names
    if (
      this.matches(normalizedName, [
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
      ])
    ) {
      return 'asian_male';
    }

    // Latino names
    if (
      this.matches(normalizedName, [
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
      ])
    ) {
      return 'latino_male';
    }

    // Default to caucasian
    return 'caucasian_male';
  }

  /**
   * Check if name is likely female (heuristic-based)
   */
  private isFemaleName(normalizedName: string): boolean {
    const femaleNames = [
      'maria',
      'ana',
      'sofia',
      'lucia',
      'sara',
      'elena',
      'carmen',
      'julia',
      'laura',
      'patricia',
      'isabel',
      'cristina',
      'monica',
      'andrea',
      'paula',
      'isabella',
      'valentina',
      'natalia',
      'claudia',
      'diana',
      'beatriz',
      'teresa',
      'rosa',
      'dolores',
      'mercedes',
    ];

    // Check exact match first (more reliable)
    if (this.matches(normalizedName, femaleNames)) {
      return true;
    }

    // Check if ends with 'a' (common in Spanish/Italian female names)
    // But exclude known male exceptions
    const maleExceptions = [
      'luca',
      'luka',
      'jose',
      'josé',
      'borja',
      'santiago',
      'mika',
      'sasha',
      'noah',
      'elias',
      'jonah',
      'joshua',
    ];
    if (normalizedName.endsWith('a') && !maleExceptions.includes(normalizedName)) {
      return true;
    }

    return false;
  }

  private matches(name: string, list: string[]): boolean {
    return list.some((item) => name.includes(item) || name === item);
  }
}
