import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConditionEvaluatorService {

  constructor() { }

  evaluate(variableValue: any, operator: string, targetValue: any): boolean {
    // Normalization
    const val = this.normalize(variableValue);
    const target = this.normalize(targetValue);

    console.log(`Evaluating Rule: [${val}] ${operator} [${target}]`);

    switch (operator) {
      case '==': return val == target;
      case '!=': return val != target;
      case '>': return Number(val) > Number(target);
      case '<': return Number(val) < Number(target);
      case '>=': return Number(val) >= Number(target);
      case '<=': return Number(val) <= Number(target);
      case 'contains': 
        return String(val).toLowerCase().includes(String(target).toLowerCase());
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private normalize(value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    return value;
  }
}
