/**
 * Scoring Engine for Matchmaking
 * Computes weighted match scores with explainability
 */

import {
  calculateAllMetrics,
  TFIDFCorpus
} from './metrics';

// ============================================
// TYPES
// ============================================

export interface Actor {
  id: string;
  actorType: 'company' | 'sponsor' | 'attendee';
  name: string;
  slug?: string;
  stage?: string;
  categories?: string[];
  platforms?: string[];
  markets?: string[];
  capabilities?: string[];
  needs?: string[];
  tags?: string[];
  role?: string[];
  text?: {
    title?: string;
    description?: string;
    abstract?: string;
    bio?: string;
  };
  numeric?: {
    rating?: number;
    teamSize?: number;
    funding?: number;
  };
  dates?: {
    created?: Date | string;
    updated?: Date | string;
    founded?: Date | string;
  };
  preferences?: {
    meetingDurations?: number[];
    availability?: Array<{ day: string; slots: string[] }>;
    meetingLocations?: string[];
  };
  consent?: {
    matchmaking?: boolean;
    marketing?: boolean;
    showPublicCard?: boolean;
  };
  piiRef?: string;
  updatedAt: Date | string;
}

export interface WeightProfile {
  profileId: string;
  weights: Record<string, number>;
  normalize?: {
    method: 'zexp' | 'zscore' | 'minmax';
    temperature?: number;
  };
  topN?: number;
  threshold?: number;
}

export interface Contribution {
  key: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface MatchResult {
  edgeId: string;
  a: string;
  b: string;
  aType: string;
  bType: string;
  score: number;
  metrics: Record<string, number>;
  weights: Record<string, number>;
  contributions: Contribution[];
  reasons: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DEFAULT WEIGHT PROFILES
// ============================================

export const DEFAULT_WEIGHTS: Record<string, WeightProfile> = {
  default: {
    profileId: 'default',
    weights: {
      'date:Created.prox': 1,
      'list:Platforms.jaccard': 2,
      'list:Markets.jaccard': 1.5,
      'list:Categories.jaccard': 2,
      'num:Rating.zexp': 1,
      'str:Name.lev': 0.5,
      'text:Description.cosine_tfidf': 1.5,
      'bipartite:cap→need': 3,
      'ctx:platform.overlap': 1,
      'ctx:market.overlap': 1,
      'ctx:stage.complement': 1.2
    },
    normalize: {
      method: 'zexp',
      temperature: 1
    },
    topN: 10,
    threshold: 0.5
  },

  publisher: {
    profileId: 'publisher',
    weights: {
      'list:Platforms.jaccard': 3,
      'list:Markets.jaccard': 2,
      'list:Categories.jaccard': 2,
      'text:Description.cosine_tfidf': 1,
      'bipartite:cap→need': 4,
      'ctx:stage.complement': 2,
      'ctx:role.intent': 2
    },
    normalize: {
      method: 'zexp',
      temperature: 1
    },
    topN: 15,
    threshold: 0.6
  },

  investor: {
    profileId: 'investor',
    weights: {
      'list:Markets.jaccard': 3,
      'num:Rating.zexp': 2,
      'num:Funding.zexp': 2,
      'text:Description.cosine_tfidf': 1.5,
      'bipartite:cap→need': 2,
      'ctx:stage.complement': 3,
      'ctx:role.intent': 2
    },
    normalize: {
      method: 'zexp',
      temperature: 1
    },
    topN: 20,
    threshold: 0.65
  },

  developer: {
    profileId: 'developer',
    weights: {
      'list:Platforms.jaccard': 3,
      'list:Tags.cosine': 2,
      'text:Description.cosine_tfidf': 2,
      'bipartite:cap→need': 3,
      'ctx:platform.overlap': 2,
      'ctx:role.intent': 1.5,
      'scan:recency.boost': 1,
      'avail:overlap': 1
    },
    normalize: {
      method: 'zexp',
      temperature: 1
    },
    topN: 12,
    threshold: 0.5
  },

  attendee: {
    profileId: 'attendee',
    weights: {
      'list:Interests.jaccard': 2.5,
      'list:Platforms.jaccard': 2,
      'text:Bio.cosine_tfidf': 1.5,
      'bipartite:cap→need': 3,
      'ctx:role.intent': 2,
      'scan:recency.boost': 1.5,
      'avail:overlap': 1.5,
      'preference:location.fit': 1
    },
    normalize: {
      method: 'zexp',
      temperature: 1
    },
    topN: 15,
    threshold: 0.55
  }
};

// ============================================
// REASON GENERATION
// ============================================

/**
 * Generate human-readable reasons from contributions
 * @param contributions Sorted contributions array
 * @param actorA Actor A data
 * @param actorB Actor B data
 * @returns Array of reason strings
 */
export function generateReasons(
  contributions: Contribution[],
  actorA: Actor,
  actorB: Actor
): string[] {
  const reasons: string[] = [];

  // Sort by contribution descending
  const sortedContributions = contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);

  for (const contrib of sortedContributions) {
    const reason = generateReasonForMetric(contrib, actorA, actorB);
    if (reason) {
      reasons.push(reason);
    }
  }

  // Add default reason if none generated
  if (reasons.length === 0) {
    reasons.push('Potential networking opportunity');
  }

  return reasons;
}

/**
 * Generate specific reason for a metric
 * @param contribution Contribution object
 * @param actorA Actor A data
 * @param actorB Actor B data
 * @returns Reason string
 */
function generateReasonForMetric(
  contribution: Contribution,
  actorA: Actor,
  actorB: Actor
): string {
  const { key, value } = contribution;
  const score = Math.round(value * 100);

  // Parse metric key
  const [type, field] = key.split(':');
  const [fieldName] = field?.split('.') || [];

  switch (type) {
    case 'list':
      if (fieldName === 'Platforms' && actorA.platforms && actorB.platforms) {
        const shared = actorA.platforms.filter(p => actorB.platforms!.includes(p));
        if (shared.length > 0) {
          return `Shared platforms: ${shared.slice(0, 2).join(', ')}`;
        }
      }
      if (fieldName === 'Markets' && actorA.markets && actorB.markets) {
        const shared = actorA.markets.filter(m => actorB.markets!.includes(m));
        if (shared.length > 0) {
          return `Operating in same markets: ${shared.slice(0, 2).join(', ')}`;
        }
      }
      if (fieldName === 'Categories' && actorA.categories && actorB.categories) {
        const shared = actorA.categories.filter(c => actorB.categories!.includes(c));
        if (shared.length > 0) {
          return `Similar industries: ${shared.slice(0, 2).join(', ')}`;
        }
      }
      if (fieldName === 'Interests') {
        return `${score}% interest overlap`;
      }
      if (fieldName === 'Tags' && score > 60) {
        return 'Similar tags and attributes';
      }
      break;

    case 'bipartite':
      if (key.includes('cap→need')) {
        const capsA = actorA.capabilities || [];
        const needsB = actorB.needs || [];
        const matches = capsA.filter(c => needsB.includes(c));
        if (matches.length > 0) {
          return `${actorA.name} offers what ${actorB.name} needs (${matches.length} matches)`;
        }
        return 'Complementary capabilities and needs';
      }
      break;

    case 'ctx':
      if (fieldName === 'stage' && actorA.stage && actorB.stage) {
        if (actorA.stage === 'Startup' && actorB.stage === 'Investor') {
          return 'Perfect stage match: Startup ↔ Investor';
        }
        if (score > 70) {
          return `Compatible company stages: ${actorA.stage} ↔ ${actorB.stage}`;
        }
      }
      if (fieldName === 'role' && score > 70) {
        return 'Strong role alignment for collaboration';
      }
      if (fieldName === 'platform' && score > 60) {
        return 'Platform compatibility for partnership';
      }
      break;

    case 'text':
      if (score > 70) {
        return `${score}% content similarity in ${fieldName.toLowerCase()}`;
      }
      break;

    case 'scan':
      if (key.includes('recency') && score > 50) {
        return 'Recently scanned at event';
      }
      break;

    case 'avail':
      if (score > 60) {
        return `${score}% meeting availability overlap`;
      }
      break;

    case 'preference':
      if (fieldName === 'location' && score > 70) {
        return 'Preferred meeting location match';
      }
      break;

    case 'date':
      if (fieldName === 'Created' && score > 70) {
        return 'Joined around the same time';
      }
      break;

    case 'num':
      if (fieldName === 'Rating' && score > 80) {
        return 'Similar quality ratings';
      }
      if (fieldName === 'TeamSize' && score > 70) {
        return 'Compatible team sizes';
      }
      break;
  }

  // Generic fallback
  if (score > 80) {
    return `High ${fieldName.toLowerCase()} compatibility (${score}%)`;
  }

  return '';
}

// ============================================
// SCORING ENGINE
// ============================================

/**
 * Compute match score between two actors
 * @param actorA First actor
 * @param actorB Second actor
 * @param weights Weight profile
 * @param corpus Optional TF-IDF corpus
 * @returns Match result
 */
export function computeMatchScore(
  actorA: Actor,
  actorB: Actor,
  weights: WeightProfile = DEFAULT_WEIGHTS.default,
  corpus?: TFIDFCorpus
): MatchResult {
  // Check consent for attendees
  if (actorA.actorType === 'attendee' && !actorA.consent?.matchmaking) {
    throw new Error(`Attendee ${actorA.id} has not consented to matchmaking`);
  }
  if (actorB.actorType === 'attendee' && !actorB.consent?.matchmaking) {
    throw new Error(`Attendee ${actorB.id} has not consented to matchmaking`);
  }

  // Calculate all metrics
  const metrics = calculateAllMetrics(actorA, actorB, corpus);

  // Calculate contributions
  const contributions: Contribution[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [metricKey, metricValue] of Object.entries(metrics)) {
    const weight = weights.weights[metricKey] || 0;

    if (weight > 0) {
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
  }

  // Calculate final score
  const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Generate reasons
  const reasons = generateReasons(contributions, actorA, actorB);

  // Create edge ID (sorted to avoid duplicates)
  const edgeId = actorA.id < actorB.id
    ? `${actorA.id}__${actorB.id}`
    : `${actorB.id}__${actorA.id}`;

  return {
    edgeId,
    a: actorA.id,
    b: actorB.id,
    aType: actorA.actorType,
    bType: actorB.actorType,
    score: Math.min(1, Math.max(0, finalScore)), // Clamp to [0, 1]
    metrics,
    weights: weights.weights,
    contributions: contributions.sort((a, b) => b.contribution - a.contribution),
    reasons,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============================================
// CANDIDATE SELECTION
// ============================================

/**
 * Get candidate matches for an actor
 * @param actor Target actor
 * @param allActors All actors in system
 * @param maxCandidates Maximum candidates to consider
 * @returns Filtered candidate list
 */
export function getCandidates(
  actor: Actor,
  allActors: Actor[],
  maxCandidates: number = 1000
): Actor[] {
  const candidates = allActors.filter(other => {
    // Don't match with self
    if (other.id === actor.id) return false;

    // Check consent for attendees
    if (other.actorType === 'attendee' && !other.consent?.matchmaking) {
      return false;
    }

    // Must share at least one dimension for relevance
    const platformOverlap = actor.platforms && other.platforms &&
      actor.platforms.some(p => other.platforms!.includes(p));

    const marketOverlap = actor.markets && other.markets &&
      actor.markets.some(m => other.markets!.includes(m));

    const categoryOverlap = actor.categories && other.categories &&
      actor.categories.some(c => other.categories!.includes(c));

    const capNeedMatch = (actor.capabilities && other.needs &&
      actor.capabilities.some(c => other.needs!.includes(c))) ||
      (actor.needs && other.capabilities &&
      actor.needs.some(n => other.capabilities!.includes(n)));

    // Include if any dimension overlaps
    return platformOverlap || marketOverlap || categoryOverlap || capNeedMatch;
  });

  // Return limited set
  return candidates.slice(0, maxCandidates);
}

// ============================================
// BATCH PROCESSING
// ============================================

/**
 * Compute matches for all actors
 * @param actors All actors
 * @param weights Weight profile
 * @param corpus Optional TF-IDF corpus
 * @param batchSize Batch size for processing
 * @returns Array of match results
 */
export async function computeAllMatches(
  actors: Actor[],
  weights: WeightProfile = DEFAULT_WEIGHTS.default,
  corpus?: TFIDFCorpus,
  batchSize: number = 400
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];
  const processedPairs = new Set<string>();

  // Process each actor
  for (const actor of actors) {
    // Get candidates
    const candidates = getCandidates(actor, actors);

    // Process in batches
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);

      const batchMatches = batch.map(candidate => {
        // Create sorted pair ID to avoid duplicates
        const pairId = actor.id < candidate.id
          ? `${actor.id}__${candidate.id}`
          : `${candidate.id}__${actor.id}`;

        // Skip if already processed
        if (processedPairs.has(pairId)) {
          return null;
        }

        processedPairs.add(pairId);

        // Compute match
        try {
          const match = computeMatchScore(actor, candidate, weights, corpus);

          // Only include if above threshold
          if (match.score >= (weights.threshold || 0)) {
            return match;
          }
        } catch (error) {
          console.error(`Error computing match for ${pairId}:`, error);
        }

        return null;
      }).filter(Boolean) as MatchResult[];

      matches.push(...batchMatches);

      // Small delay to prevent blocking
      if (i + batchSize < candidates.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// ============================================
// TOP MATCHES
// ============================================

/**
 * Get top matches for a specific actor
 * @param actorId Actor ID
 * @param matches All matches
 * @param limit Maximum matches to return
 * @returns Top matches for actor
 */
export function getTopMatchesForActor(
  actorId: string,
  matches: MatchResult[],
  limit: number = 10
): MatchResult[] {
  const actorMatches = matches.filter(
    m => m.a === actorId || m.b === actorId
  );

  return actorMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============================================
// MATCH STATISTICS
// ============================================

/**
 * Calculate match statistics
 * @param matches Array of matches
 * @returns Statistics object
 */
export function calculateMatchStatistics(matches: MatchResult[]) {
  if (matches.length === 0) {
    return {
      count: 0,
      avgScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      scoreDistribution: {}
    };
  }

  const scores = matches.map(m => m.score);
  scores.sort((a, b) => a - b);

  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const median = scores[Math.floor(scores.length / 2)];
  const min = scores[0];
  const max = scores[scores.length - 1];

  // Score distribution in buckets
  const distribution: Record<string, number> = {
    '0.0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0
  };

  for (const score of scores) {
    if (score <= 0.2) distribution['0.0-0.2']++;
    else if (score <= 0.4) distribution['0.2-0.4']++;
    else if (score <= 0.6) distribution['0.4-0.6']++;
    else if (score <= 0.8) distribution['0.6-0.8']++;
    else distribution['0.8-1.0']++;
  }

  return {
    count: matches.length,
    avgScore: avg,
    medianScore: median,
    minScore: min,
    maxScore: max,
    scoreDistribution: distribution
  };
}