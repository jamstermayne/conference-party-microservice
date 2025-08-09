/**
 * EVENT ENTITY - Domain-Driven Design Implementation
 * Enterprise-grade event entity with comprehensive validation and business logic
 */

import { z } from 'zod';
import { DomainEntity } from '../base/DomainEntity';
import { EventId } from '../value-objects/EventId';
import { Location } from '../value-objects/Location';
import { DateTimeRange } from '../value-objects/DateTimeRange';
import { EventCategory } from '../value-objects/EventCategory';
import { EventStatus } from '../value-objects/EventStatus';

// Comprehensive validation schema
export const EventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['networking', 'afterparty', 'mixer', 'launch', 'conference', 'workshop', 'meetup', 'other']),
  status: z.enum(['draft', 'active', 'cancelled', 'completed', 'archived']),
  creator: z.string().min(2).max(100),
  hosts: z.array(z.string()).min(1).max(10),
  location: z.object({
    name: z.string().min(1).max(300),
    address: z.string().min(1).max(500),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    capacity: z.number().min(1).max(100000).optional(),
    venue_type: z.enum(['indoor', 'outdoor', 'virtual', 'hybrid']).optional(),
  }),
  dateTime: z.object({
    start: z.string().datetime(),
    end: z.string().datetime().optional(),
    timezone: z.string().default('UTC'),
    all_day: z.boolean().default(false),
  }),
  attendance: z.object({
    expected: z.number().min(0).optional(),
    confirmed: z.number().min(0).default(0),
    max_capacity: z.number().min(1).optional(),
    registration_required: z.boolean().default(false),
    registration_url: z.string().url().optional(),
  }).optional(),
  metadata: z.object({
    source: z.enum(['ugc', 'official', 'import', 'api']).default('ugc'),
    tags: z.array(z.string()).max(20).default([]),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
  }).optional(),
  timestamps: z.object({
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    published_at: z.string().datetime().optional(),
    archived_at: z.string().datetime().optional(),
  }),
  analytics: z.object({
    views: z.number().min(0).default(0),
    likes: z.number().min(0).default(0),
    shares: z.number().min(0).default(0),
    rsvp_count: z.number().min(0).default(0),
  }).optional(),
});

export type EventProps = z.infer<typeof EventSchema>;

/**
 * Event Domain Entity
 * Implements rich domain logic with comprehensive business rules
 */
export class Event extends DomainEntity<EventProps> {
  private constructor(props: EventProps, id?: EventId) {
    super(props, id);
  }

  /**
   * Factory method with comprehensive validation
   */
  public static create(props: Omit<EventProps, 'id' | 'timestamps'>): Event {
    // Validate input
    const validatedProps = this.validateEventProps(props);
    
    // Generate ID
    const eventId = EventId.create();
    
    // Set timestamps
    const now = new Date().toISOString();
    const fullProps: EventProps = {
      ...validatedProps,
      id: eventId.value,
      timestamps: {
        created_at: now,
        updated_at: now,
      },
    };

    return new Event(fullProps, eventId);
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(props: EventProps): Event {
    const validatedProps = EventSchema.parse(props);
    return new Event(validatedProps, EventId.fromString(props.id));
  }

  /**
   * Business Logic: Check if event is upcoming
   */
  public isUpcoming(): boolean {
    const now = new Date();
    const startTime = new Date(this.props.dateTime.start);
    return startTime > now;
  }

  /**
   * Business Logic: Check if event is currently happening
   */
  public isHappening(): boolean {
    const now = new Date();
    const startTime = new Date(this.props.dateTime.start);
    const endTime = this.props.dateTime.end ? new Date(this.props.dateTime.end) : new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours
    
    return now >= startTime && now <= endTime;
  }

  /**
   * Business Logic: Check if event has ended
   */
  public hasEnded(): boolean {
    const now = new Date();
    const endTime = this.props.dateTime.end ? new Date(this.props.dateTime.end) : new Date(new Date(this.props.dateTime.start).getTime() + 3 * 60 * 60 * 1000);
    
    return now > endTime;
  }

  /**
   * Business Logic: Check if event is cancelable
   */
  public canBeCancelled(): boolean {
    return this.props.status === 'active' || this.props.status === 'draft';
  }

  /**
   * Business Logic: Cancel event
   */
  public cancel(reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Event cannot be cancelled in its current state');
    }
    
    this.props.status = 'cancelled';
    this.props.timestamps.updated_at = new Date().toISOString();
    
    this.addDomainEvent({
      eventType: 'EventCancelled',
      eventId: this.id.value,
      payload: { reason },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Business Logic: Update attendance
   */
  public updateAttendance(confirmed: number): void {
    if (confirmed < 0) {
      throw new Error('Attendance count cannot be negative');
    }
    
    if (this.props.attendance?.max_capacity && confirmed > this.props.attendance.max_capacity) {
      throw new Error('Attendance exceeds maximum capacity');
    }
    
    if (!this.props.attendance) {
      this.props.attendance = { confirmed: 0 };
    }
    
    const previousCount = this.props.attendance.confirmed;
    this.props.attendance.confirmed = confirmed;
    this.props.timestamps.updated_at = new Date().toISOString();
    
    this.addDomainEvent({
      eventType: 'AttendanceUpdated',
      eventId: this.id.value,
      payload: { previousCount, newCount: confirmed },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Business Logic: Feature event
   */
  public feature(): void {
    if (!this.props.metadata) {
      this.props.metadata = {
        source: 'ugc',
        tags: [],
        priority: 'normal',
        visibility: 'public',
        featured: false,
        verified: false,
      };
    }
    
    this.props.metadata.featured = true;
    this.props.metadata.priority = 'high';
    this.props.timestamps.updated_at = new Date().toISOString();
    
    this.addDomainEvent({
      eventType: 'EventFeatured',
      eventId: this.id.value,
      payload: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Business Logic: Verify event
   */
  public verify(): void {
    if (!this.props.metadata) {
      this.props.metadata = {
        source: 'ugc',
        tags: [],
        priority: 'normal',
        visibility: 'public',
        featured: false,
        verified: false,
      };
    }
    
    this.props.metadata.verified = true;
    this.props.timestamps.updated_at = new Date().toISOString();
    
    this.addDomainEvent({
      eventType: 'EventVerified',
      eventId: this.id.value,
      payload: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Business Logic: Record analytics action
   */
  public recordAnalyticsAction(action: 'view' | 'like' | 'share' | 'rsvp'): void {
    if (!this.props.analytics) {
      this.props.analytics = {
        views: 0,
        likes: 0,
        shares: 0,
        rsvp_count: 0,
      };
    }
    
    switch (action) {
      case 'view':
        this.props.analytics.views++;
        break;
      case 'like':
        this.props.analytics.likes++;
        break;
      case 'share':
        this.props.analytics.shares++;
        break;
      case 'rsvp':
        this.props.analytics.rsvp_count++;
        break;
    }
    
    this.props.timestamps.updated_at = new Date().toISOString();
  }

  /**
   * Get event location
   */
  public get location(): Location {
    return Location.create(this.props.location);
  }

  /**
   * Get event date time range
   */
  public get dateTimeRange(): DateTimeRange {
    return DateTimeRange.create({
      start: this.props.dateTime.start,
      end: this.props.dateTime.end,
      timezone: this.props.dateTime.timezone,
    });
  }

  /**
   * Get event category
   */
  public get category(): EventCategory {
    return EventCategory.create(this.props.category);
  }

  /**
   * Get event status
   */
  public get status(): EventStatus {
    return EventStatus.create(this.props.status);
  }

  /**
   * Get read-only props for serialization
   */
  public getProps(): Readonly<EventProps> {
    return Object.freeze({ ...this.props });
  }

  /**
   * Enhanced validation with business rules
   */
  private static validateEventProps(props: any): EventProps {
    // Schema validation
    const validatedProps = EventSchema.parse(props);
    
    // Business rule validations
    const startTime = new Date(validatedProps.dateTime.start);
    const endTime = validatedProps.dateTime.end ? new Date(validatedProps.dateTime.end) : null;
    
    // Start time cannot be in the past (with 5-minute buffer)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (startTime < fiveMinutesAgo) {
      throw new Error('Event start time cannot be in the past');
    }
    
    // End time must be after start time
    if (endTime && endTime <= startTime) {
      throw new Error('Event end time must be after start time');
    }
    
    // Event duration cannot exceed 7 days
    if (endTime) {
      const durationMs = endTime.getTime() - startTime.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (durationMs > sevenDaysMs) {
        throw new Error('Event duration cannot exceed 7 days');
      }
    }
    
    // Capacity validation
    if (validatedProps.attendance?.max_capacity && validatedProps.attendance.max_capacity < 1) {
      throw new Error('Maximum capacity must be at least 1');
    }
    
    // Registration URL required if registration is required
    if (validatedProps.attendance?.registration_required && !validatedProps.attendance.registration_url) {
      throw new Error('Registration URL is required when registration is required');
    }
    
    return validatedProps;
  }
}