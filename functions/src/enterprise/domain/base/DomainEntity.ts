/**
 * DOMAIN ENTITY BASE CLASS
 * Enterprise-grade base class implementing Domain-Driven Design patterns
 */

export interface DomainEvent {
  eventType: string;
  eventId: string;
  payload: any;
  timestamp: string;
  version?: number;
  correlationId?: string;
}

/**
 * Abstract base class for all domain entities
 * Implements identity, equality, and domain event patterns
 */
export abstract class DomainEntity<T> {
  protected readonly _id: any;
  protected props: T;
  private _domainEvents: DomainEvent[] = [];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: T, id?: any) {
    this._id = id;
    this.props = props;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Get entity ID
   */
  public get id(): any {
    return this._id;
  }

  /**
   * Get creation timestamp
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Get last updated timestamp
   */
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Entity equality based on ID
   */
  public equals(entity: DomainEntity<T>): boolean {
    if (!(entity instanceof DomainEntity)) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!this._id || !entity._id) {
      return false;
    }

    return this._id.equals ? this._id.equals(entity._id) : this._id === entity._id;
  }

  /**
   * Add domain event
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push({
      ...event,
      version: this._domainEvents.length + 1,
      correlationId: this.generateCorrelationId(),
    });
    this._updatedAt = new Date();
  }

  /**
   * Get all domain events
   */
  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear domain events (typically called after events are published)
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if entity has domain events
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get entity snapshot for persistence
   */
  public getSnapshot(): any {
    return {
      id: this._id,
      props: this.props,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      domainEvents: this._domainEvents,
    };
  }

  /**
   * Validate entity invariants
   * Override in concrete entities to implement business rules
   */
  protected validateInvariants(): void {
    // Base implementation - override in concrete entities
  }

  /**
   * Generate correlation ID for event tracking
   */
  private generateCorrelationId(): string {
    return `${this._id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Update entity props with validation
   */
  protected updateProps(newProps: Partial<T>): void {
    this.props = { ...this.props, ...newProps };
    this._updatedAt = new Date();
    this.validateInvariants();
  }

  /**
   * Get hash code for the entity
   */
  public getHashCode(): string {
    return this._id ? this._id.toString() : JSON.stringify(this.props);
  }

  /**
   * Convert entity to string representation
   */
  public toString(): string {
    return `${this.constructor.name}(${this.getHashCode()})`;
  }

  /**
   * Clone entity with new props
   */
  public clone(newProps?: Partial<T>): this {
    const ClonedClass = this.constructor as any;
    return new ClonedClass(
      newProps ? { ...this.props, ...newProps } : this.props,
      this._id
    );
  }
}