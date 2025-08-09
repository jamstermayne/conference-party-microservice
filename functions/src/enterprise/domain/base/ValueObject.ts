/**
 * VALUE OBJECT BASE CLASS
 * Enterprise-grade base class for immutable value objects
 */

/**
 * Abstract base class for value objects
 * Implements immutability and value equality
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Value objects are equal if their props are equal
   */
  public equals(other: ValueObject<T>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }

    return this.deepEquals(this.props, other.props);
  }

  /**
   * Deep equality comparison
   */
  private deepEquals(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return false;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepEquals(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get hash code for the value object
   */
  public getHashCode(): string {
    return JSON.stringify(this.props);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return `${this.constructor.name}(${JSON.stringify(this.props)})`;
  }

  /**
   * Get a copy of the props (defensive copy)
   */
  protected getProps(): T {
    return JSON.parse(JSON.stringify(this.props));
  }
}