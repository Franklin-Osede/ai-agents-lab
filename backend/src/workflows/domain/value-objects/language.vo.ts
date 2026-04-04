export enum LanguageEnum {
  ES = 'es',
  EN = 'en',
}

export class Language {
  private constructor(public readonly value: LanguageEnum) {}

  public static create(value: string): Language {
    const normalized = value.toLowerCase();

    if (normalized === 'en') {
      return new Language(LanguageEnum.EN);
    }

    // Default to Spanish for backward compatibility or invalid inputs
    return new Language(LanguageEnum.ES);
  }

  public isEnglish(): boolean {
    return this.value === LanguageEnum.EN;
  }

  public isSpanish(): boolean {
    return this.value === LanguageEnum.ES;
  }

  public toString(): string {
    return this.value;
  }
}
