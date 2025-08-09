/**
 * EVENT ID VALUE OBJECT
 * Implements type-safe, immutable event identification
 */

import { ValueObject } from '../base/ValueObject';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

interface EventIdProps {
  value: string;
}

/**
 * Event ID Value Object
 * Ensures event IDs are valid, unique, and type-safe
 */
export class EventId extends ValueObject<EventIdProps> {
  private constructor(props: EventIdProps) {
    super(props);
  }

  /**
   * Create new EventId with generated UUID
   */
  public static create(): EventId {
    const uuid = uuidv4();
    return new EventId({ value: `evt_${uuid}` });
  }

  /**
   * Create EventId from existing string
   */
  public static fromString(id: string): EventId {
    if (!EventId.isValid(id)) {
      throw new Error(`Invalid EventId format: ${id}`);
    }
    return new EventId({ value: id });
  }

  /**
   * Validate EventId format
   */
  public static isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Check format: evt_[uuid]
    if (!id.startsWith('evt_')) {
      return false;
    }

    const uuid = id.substring(4);
    return uuidValidate(uuid);
  }

  /**
   * Get the string value
   */
  public get value(): string {
    return this.props.value;
  }

  /**
   * Get the UUID part
   */
  public get uuid(): string {
    return this.props.value.substring(4);
  }

  /**
   * Convert to string
   */
  public toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON
   */
  public toJSON(): string {
    return this.props.value;
  }

  /**
   * Create short ID for display purposes
   */
  public toShortId(): string {
    return this.props.value.substring(0, 12) + '...';
  }
}