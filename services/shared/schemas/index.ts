import Joi from 'joi';

// User Schema
export const UserSchema = Joi.object({
  id: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  title: Joi.string().max(100).optional(),
  company: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  avatar: Joi.string().uri().optional(),
  linkedIn: Joi.string().uri().optional(),
  twitter: Joi.string().pattern(/^@?[A-Za-z0-9_]{1,15}$/).optional(),
  interests: Joi.array().items(Joi.string()).max(10).default([]),
  goals: Joi.array().items(Joi.string()).max(5).default([]),
  skills: Joi.array().items(Joi.string()).max(20).default([]),
  preferences: Joi.object({
    visibility: Joi.string().valid('public', 'connections', 'private').default('public'),
    notifications: Joi.boolean().default(true),
    matchingEnabled: Joi.boolean().default(true),
    dataSharing: Joi.boolean().default(false)
  }).default(),
  stats: Joi.object({
    connectionsCount: Joi.number().integer().min(0).default(0),
    eventsAttended: Joi.number().integer().min(0).default(0),
    matchScore: Joi.number().min(0).max(100).default(0),
    lastActive: Joi.date().iso().optional()
  }).default(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Event Schema
export const EventSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).optional(),
  venue: Joi.string().max(200).required(),
  venueId: Joi.string().optional(),
  date: Joi.date().iso().required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  price: Joi.string().max(50).default('Free'),
  capacity: Joi.number().integer().min(1).optional(),
  attendeeCount: Joi.number().integer().min(0).default(0),
  tags: Joi.array().items(Joi.string()).max(10).default([]),
  organizer: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().optional()
  }).optional(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').default('published'),
  visibility: Joi.string().valid('public', 'private', 'invite-only').default('public'),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Match Schema
export const MatchSchema = Joi.object({
  id: Joi.string().required(),
  users: Joi.array().items(Joi.string()).length(2).required(),
  score: Joi.number().min(0).max(100).required(),
  reasons: Joi.array().items(Joi.string()).min(1).max(5).required(),
  commonInterests: Joi.array().items(Joi.string()).default([]),
  suggestedTopics: Joi.array().items(Joi.string()).max(5).default([]),
  status: Joi.string().valid('pending', 'accepted', 'rejected', 'expired').default('pending'),
  expiresAt: Joi.date().iso().optional(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Connection Schema
export const ConnectionSchema = Joi.object({
  id: Joi.string().required(),
  fromUserId: Joi.string().required(),
  toUserId: Joi.string().required(),
  status: Joi.string().valid('pending', 'accepted', 'rejected', 'blocked').default('pending'),
  message: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string()).max(5).default([]),
  metAt: Joi.string().max(200).optional(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Invite Schema
export const InviteSchema = Joi.object({
  id: Joi.string().required(),
  code: Joi.string().alphanum().length(8).required(),
  createdBy: Joi.string().required(),
  usedBy: Joi.string().optional(),
  maxUses: Joi.number().integer().min(1).default(1),
  currentUses: Joi.number().integer().min(0).default(0),
  expiresAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
  status: Joi.string().valid('active', 'used', 'expired', 'revoked').default('active'),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Metric Schema
export const MetricSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('pageview', 'event', 'timing', 'error', 'api').required(),
  category: Joi.string().max(100).required(),
  action: Joi.string().max(100).optional(),
  label: Joi.string().max(200).optional(),
  value: Joi.number().optional(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().required(),
  metadata: Joi.object().optional(),
  timestamp: Joi.date().iso().required()
});

// Webhook Schema
export const WebhookSchema = Joi.object({
  id: Joi.string().required(),
  url: Joi.string().uri().required(),
  events: Joi.array().items(Joi.string()).min(1).required(),
  secret: Joi.string().min(32).optional(),
  active: Joi.boolean().default(true),
  metadata: Joi.object().optional(),
  lastTriggered: Joi.date().iso().optional(),
  failureCount: Joi.number().integer().min(0).default(0),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Feature Flag Schema
export const FeatureFlagSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  enabled: Joi.boolean().default(false),
  rolloutPercentage: Joi.number().min(0).max(100).optional(),
  targetGroups: Joi.array().items(Joi.string()).default([]),
  conditions: Joi.array().items(Joi.object({
    type: Joi.string().valid('user', 'group', 'percentage', 'date', 'custom').required(),
    operator: Joi.string().valid('equals', 'contains', 'greater', 'less', 'between').required(),
    value: Joi.any().required()
  })).default([]),
  metadata: Joi.object().optional(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required()
});

// Validation helper function
export function validateSchema<T>(schema: Joi.Schema, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    throw new ValidationError('Validation failed', errors);
  }

  return value as T;
}

// Custom validation error
export class ValidationError extends Error {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Type exports
export type User = ReturnType<typeof UserSchema.validate>['value'];
export type Event = ReturnType<typeof EventSchema.validate>['value'];
export type Match = ReturnType<typeof MatchSchema.validate>['value'];
export type Connection = ReturnType<typeof ConnectionSchema.validate>['value'];
export type Invite = ReturnType<typeof InviteSchema.validate>['value'];
export type Metric = ReturnType<typeof MetricSchema.validate>['value'];
export type Webhook = ReturnType<typeof WebhookSchema.validate>['value'];
export type FeatureFlag = ReturnType<typeof FeatureFlagSchema.validate>['value'];

// Default values factory
export const createDefaults = {
  user: (data: Partial<User> = {}): User => validateSchema(UserSchema, {
    id: data.id || `user-${Date.now()}`,
    email: data.email || '',
    name: data.name || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    ...data
  }),

  event: (data: Partial<Event> = {}): Event => validateSchema(EventSchema, {
    id: data.id || `event-${Date.now()}`,
    title: data.title || '',
    venue: data.venue || '',
    date: data.date || new Date().toISOString(),
    startTime: data.startTime || '09:00',
    endTime: data.endTime || '17:00',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    ...data
  }),

  match: (data: Partial<Match> = {}): Match => validateSchema(MatchSchema, {
    id: data.id || `match-${Date.now()}`,
    users: data.users || [],
    score: data.score || 0,
    reasons: data.reasons || ['Common interests'],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    ...data
  })
};