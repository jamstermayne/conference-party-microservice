# Next-Level Matchmaking Engine Architecture

## Overview

A sophisticated Firebase-based matchmaking system implementing company↔company, company↔attendee, and sponsor↔attendee matching with explainability, admin weight control, and rich visualizations.

## Architecture Principles

### Microservice Design (1 Function = 1 Thing)
- **Ingest Service**: Handles CSV/XLSX upload and data validation
- **Matching Service**: Computes pairwise match scores
- **Metrics Service**: Calculates individual signal metrics
- **Admin Service**: Manages weights and configurations
- **Scan Service**: Processes badge scan events
- **Meeting Service**: Handles meeting requests and scheduling

### Google Backend Services Integration
- **Firebase Functions**: Serverless compute for matching engine
- **Firestore**: Document database for companies, attendees, matches
- **Cloud Storage**: File uploads (CSV/XLSX) and exports
- **Firebase Auth**: Google sign-in with admin role management
- **Cloud Scheduler**: Periodic recomputation of matches
- **Cloud Tasks**: Async processing of large match computations

## Data Model

### Core Collections

#### `/companies/{id}`
```javascript
{
  id: "c-<slug>",           // Deterministic ID
  slug: string,
  name: string,
  stage: "Startup" | "Scale" | "Enterprise",
  categories: string[],     // Industry categories
  platforms: string[],      // Mobile, PC, Console, Web
  markets: string[],        // NA, EU, APAC, LATAM, MEA
  capabilities: string[],   // What they offer
  needs: string[],          // What they seek
  tags: string[],
  website: string,
  logoUrl: string,
  text: {
    title: string,
    description: string,
    abstract: string
  },
  numeric: {
    rating: number,
    teamSize: number,
    funding: number
  },
  dates: {
    created: timestamp,
    updated: timestamp,
    founded: timestamp
  },
  embedding: number[],      // Optional ML embeddings
  updatedAt: timestamp
}
```

#### `/attendees/{id}`
```javascript
{
  id: "a-<uuid>",
  email: string,            // PII - secured
  fullName: string,         // PII - secured
  org: string,
  title: string,
  role: string[],           // Developer, Publisher, Investor
  interests: string[],      // UA, Analytics, Backend, Funding
  capabilities: string[],
  needs: string[],
  platforms: string[],
  markets: string[],
  tags: string[],           // speaker, vip, press
  bio: string,
  links: {
    website: string,
    linkedin: string,
    twitter: string
  },
  consent: {
    marketing: boolean,
    matchmaking: boolean,
    showPublicCard: boolean,
    timestamp: timestamp
  },
  preferences: {
    meetingDurations: number[],    // [15, 30]
    availability: array<{
      day: string,
      slots: string[]
    }>,
    meetingLocations: string[]
  },
  scanStats: {
    scansGiven: number,
    scansReceived: number
  },
  source: {
    importedFrom: string,
    badgeId: string,
    qr: string
  },
  updatedAt: timestamp
}
```

#### `/actors/{id}` (Union View)
```javascript
{
  actorType: "company" | "sponsor" | "attendee",
  name: string,
  slug: string,
  categories: string[],
  platforms: string[],
  markets: string[],
  capabilities: string[],
  needs: string[],
  tags: string[],
  role: string[],
  piiRef: string,          // Reference to /attendees doc
  updatedAt: timestamp
}
```

#### `/weights/{profileId}`
```javascript
{
  profileId: string,       // default, publisher, investor, developer
  weights: {
    "date:Created.prox": 1,
    "list:Platforms.jaccard": 2,
    "num:Rating.zexp": 1,
    "str:Name.lev": 0.5,
    "text:Description.cosine_tfidf": 1.5,
    "bipartite:cap→need": 3,
    "ctx:platform.overlap": 1,
    "ctx:market.overlap": 1,
    "ctx:stage.complement": 1.2
  },
  normalize: {
    method: "zexp" | "zscore" | "minmax",
    temperature: number
  },
  topN: number,
  threshold: number
}
```

#### `/matches/{profileId}/pairs/{edgeId}`
```javascript
{
  edgeId: string,          // "A__B" sorted
  a: string,               // Actor A ID
  b: string,               // Actor B ID
  aType: string,           // company, sponsor, attendee
  bType: string,
  score: number,           // [0, 1]
  metrics: {               // Individual signal scores
    "date:Created.prox": 0.887,
    "list:Platforms.jaccard": 0.6,
    "num:Rating.zexp": 0.963,
    "text:Description.cosine_tfidf": 0.768
  },
  weights: {},             // Weights used at computation time
  contributions: [{
    key: string,
    value: number,
    weight: number,
    contribution: number
  }],
  reasons: string[],       // Human-readable explanations
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Signal Engine & Metrics

### Signal Types

#### 1. Date Proximity
```javascript
// date:<Field>.prox(A, B)
const dateProximity = (dateA, dateB, horizonDays = 365) => {
  const deltaMs = Math.abs(dateA.getTime() - dateB.getTime());
  const deltaRatio = deltaMs / (horizonDays * 24 * 60 * 60 * 1000);
  return Math.exp(-deltaRatio);
};
```

#### 2. List Jaccard Similarity
```javascript
// list:<Field>.jaccard(A, B)
const jaccardSimilarity = (listA, listB) => {
  const setA = new Set(listA);
  const setB = new Set(listB);
  const intersection = [...setA].filter(x => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.length / union.size : 0;
};
```

#### 3. Numeric Z-Score Exponential
```javascript
// num:<Field>.zexp(A, B)
const zExpSimilarity = (valueA, valueB, mean, stdDev, temperature = 1) => {
  const zA = (valueA - mean) / stdDev;
  const zB = (valueB - mean) / stdDev;
  const diff = Math.abs(zA - zB);
  return Math.exp(-diff / temperature);
};
```

#### 4. String Levenshtein
```javascript
// str:<Field>.lev(A, B)
const levenshteinSimilarity = (strA, strB) => {
  const maxLen = Math.max(strA.length, strB.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(strA, strB);
  return 1 - (distance / maxLen);
};
```

#### 5. Text TF-IDF Cosine
```javascript
// text:<Field>.cosine_tfidf(A, B)
const tfidfCosineSimilarity = (textA, textB, corpus) => {
  const vectorA = buildTfidfVector(textA, corpus);
  const vectorB = buildTfidfVector(textB, corpus);
  return cosineSimilarity(vectorA, vectorB);
};
```

#### 6. Bipartite Matching
```javascript
// bipartite:cap→need(A, B)
const bipartiteMatch = (capsA, needsB) => {
  const intersection = capsA.filter(cap => needsB.includes(cap));
  return needsB.length > 0 ? intersection.length / needsB.length : 0;
};
```

#### 7. Context Multipliers
```javascript
// ctx:platform.overlap
const platformOverlap = jaccardSimilarity(platformsA, platformsB);

// ctx:stage.complement
const stageComplement = (stageA, stageB) => {
  const complementMap = {
    'Startup-Investor': 1.0,
    'Startup-Publisher': 0.8,
    'Scale-Enterprise': 0.6,
    'Enterprise-Startup': 0.4
  };
  return complementMap[`${stageA}-${stageB}`] || 0.5;
};
```

### Scoring Algorithm

```javascript
function computeMatchScore(actorA, actorB, weights, metrics) {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const contributions = [];

  for (const [metricKey, metricValue] of Object.entries(metrics)) {
    const weight = weights[metricKey] || 1;
    const contribution = metricValue * weight;

    contributions.push({
      key: metricKey,
      value: metricValue,
      weight: weight,
      contribution: contribution
    });

    totalWeightedScore += contribution;
    totalWeight += weight;
  }

  const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Generate human-readable reasons from top contributions
  const reasons = generateReasons(contributions);

  return {
    score: finalScore,
    metrics,
    weights,
    contributions,
    reasons
  };
}
```

## Pipeline Architecture

### 1. Data Ingestion Pipeline
```
CSV/XLSX Upload → Storage → Cloud Function
                              ↓
                    Parse & Validate
                              ↓
                    Firestore Upsert
                              ↓
                    Trigger Match Compute
```

### 2. Match Computation Pipeline
```
Actor Change → Pub/Sub → Match Function
                           ↓
                    Candidate Selection
                           ↓
                    Metric Computation
                           ↓
                    Score & Rank
                           ↓
                    Store Matches
```

### 3. Badge Scan Pipeline
```
Badge Scan → HTTPS Endpoint → Validate
                                 ↓
                           Store Scan Event
                                 ↓
                           Update Counters
                                 ↓
                           Trigger Light Recompute
```

## Security & Privacy

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() {
      return request.auth != null &&
             request.auth.token.role == 'admin';
    }

    function isSelf(attId) {
      return request.auth != null &&
             request.auth.uid == attId;
    }

    match /companies/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /attendees/{attId} {
      allow read: if isAdmin() ||
                     (resource.data.consent.showPublicCard == true &&
                      resource.data.consent.matchmaking == true);
      allow write: if isAdmin() || isSelf(attId);
    }

    match /actors/{id} {
      allow read: if true;  // Non-PII union view
      allow write: if isAdmin();
    }

    match /matches/{profileId}/{doc=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /weights/{profileId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Privacy Controls
- PII stored only in `/attendees` collection
- Consent flags control visibility and matching
- Public `/actors` view excludes sensitive data
- Badge scans anonymized in analytics

## Admin Dashboard Features

### 1. Data Management
- CSV/XLSX upload with mapping wizard
- Dry-run preview with diff view
- Batch operations support
- Export capabilities

### 2. Weight Configuration
- Profile-based weight presets
- Interactive sliders with live preview
- A/B testing support
- Historical weight snapshots

### 3. Visualizations
- **Capability-Needs Heatmap**: Shows match density
- **Force-Directed Graph**: Interactive match network
- **Pipeline KPIs**: Real-time processing metrics
- **Taxonomy Explorer**: Hierarchical category browser

### 4. Match Management
- Pair explorer with explanations
- Bulk match operations
- Quality thresholds
- Manual overrides

## Performance Optimizations

### 1. Candidate Prefiltering
```javascript
// Reduce O(N²) to O(N·K) where K << N
function getCandidates(actor, allActors) {
  return allActors.filter(other => {
    // Must share at least one dimension
    const platformOverlap = intersection(actor.platforms, other.platforms).length > 0;
    const marketOverlap = intersection(actor.markets, other.markets).length > 0;
    const categoryOverlap = intersection(actor.categories, other.categories).length > 0;
    const capNeedMatch = intersection(actor.capabilities, other.needs).length > 0 ||
                         intersection(actor.needs, other.capabilities).length > 0;

    return platformOverlap || marketOverlap || categoryOverlap || capNeedMatch;
  });
}
```

### 2. Batch Processing
```javascript
// Process in chunks to avoid memory issues
const BATCH_SIZE = 400;
async function batchProcess(items, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}
```

### 3. Caching Strategy
- TF-IDF corpus cached for 1 hour
- Actor embeddings cached indefinitely
- Match scores cached until actor update
- Weight profiles cached client-side

### 4. Indexes
```json
{
  "indexes": [
    {
      "collectionGroup": "companies",
      "fields": [
        { "fieldPath": "categories", "arrayConfig": "CONTAINS" },
        { "fieldPath": "platforms", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "attendees",
      "fields": [
        { "fieldPath": "role", "arrayConfig": "CONTAINS" },
        { "fieldPath": "interests", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "actors",
      "fields": [
        { "fieldPath": "actorType", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Deployment & Operations

### Environment Variables
```bash
# Firebase
FIREBASE_PROJECT_ID=conference-party-app
FIREBASE_REGION=us-central1

# Features
EMBEDDINGS_ENABLED=false
TF_IDF_ENABLED=true
SCAN_RECENCY_HOURS=48

# Performance
MATCH_BATCH_SIZE=400
CANDIDATE_LIMIT=1000
CACHE_TTL_SECONDS=3600

# Security
ADMIN_EMAILS=admin@example.com
API_KEY=<secure-random-key>
```

### Monitoring & Alerts
- Cloud Function execution times
- Firestore read/write quotas
- Match computation latency
- Error rates by service

### CI/CD Pipeline
```yaml
name: Deploy Matchmaking Engine
on:
  push:
    branches: [main]
    paths:
      - 'functions/**'
      - 'firestore.rules'
      - 'storage.rules'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
```

## Testing Strategy

### Unit Tests
```javascript
describe('Metrics', () => {
  test('jaccard similarity', () => {
    expect(jaccardSimilarity(['a', 'b'], ['b', 'c'])).toBe(0.333);
  });

  test('date proximity', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-15');
    expect(dateProximity(date1, date2, 30)).toBeCloseTo(0.606);
  });
});
```

### Integration Tests
```javascript
describe('Match Pipeline', () => {
  test('end-to-end match computation', async () => {
    const actorA = await createTestCompany();
    const actorB = await createTestCompany();

    await computeMatches([actorA, actorB]);

    const match = await getMatch(actorA.id, actorB.id);
    expect(match.score).toBeGreaterThan(0);
    expect(match.reasons).toHaveLength(3);
  });
});
```

### Load Tests
```javascript
// Test with 10,000 actors
async function loadTest() {
  const actors = await generateTestActors(10000);
  const startTime = Date.now();

  await computeAllMatches(actors);

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(300000); // 5 minutes
}
```

## Success Metrics

### Technical KPIs
- Match computation time < 100ms per pair
- API response time < 200ms p95
- Cache hit rate > 80%
- Error rate < 0.1%

### Business KPIs
- Match acceptance rate > 30%
- Meeting request conversion > 20%
- User engagement (views per session) > 5
- Attendee consent rate > 60%

## Future Enhancements

### Phase 2
- ML embeddings with Vertex AI
- Real-time collaborative filtering
- Smart meeting scheduling with calendar integration
- Mobile app with offline support

### Phase 3
- Multi-event support
- Historical match analysis
- Predictive match scoring
- Integration with CRM systems

## Conclusion

This architecture provides a scalable, explainable, and privacy-conscious matchmaking system that can handle 10,000+ actors with sub-second match computations. The modular design allows for easy extension and optimization while maintaining clear separation of concerns.