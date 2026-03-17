export interface TemplateIntentProps {
  name: string;
  displayName: string;
  examples: string[];
  icon: string;
  description?: string;
}

export class TemplateIntent {
  private constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly examples: string[],
    public readonly icon: string,
    public readonly description?: string,
  ) {}

  static create(props: TemplateIntentProps): TemplateIntent {
    if (!props.name || !props.displayName) {
      throw new Error('Intent name and displayName are required');
    }
    if (!props.examples || props.examples.length === 0) {
      throw new Error('Intent must have at least one example');
    }

    return new TemplateIntent(
      props.name,
      props.displayName,
      props.examples,
      props.icon || '💬',
      props.description,
    );
  }

  matches(userInput: string): boolean {
    const normalizedInput = userInput.toLowerCase().trim();

    return this.examples.some((example) => {
      const normalizedExample = example.toLowerCase().trim();
      // Simple keyword matching - can be enhanced with NLP later
      return (
        normalizedInput.includes(normalizedExample) || normalizedExample.includes(normalizedInput)
      );
    });
  }

  toJSON() {
    return {
      name: this.name,
      displayName: this.displayName,
      examples: this.examples,
      icon: this.icon,
      description: this.description,
    };
  }
}
