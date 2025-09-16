/**
 * Signal-Based Metrics Engine
 * Implements various similarity metrics for matchmaking
 */

// ============================================
// DATE METRICS
// ============================================

/**
 * Date proximity metric - exponential decay based on time difference
 * @param dateA First date
 * @param dateB Second date
 * @param horizonDays Time horizon in days (default 365)
 * @returns Similarity score [0, 1]
 */
export function dateProximity(
  dateA: Date | string | number,
  dateB: Date | string | number,
  horizonDays: number = 365
): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();

  if (isNaN(msA) || isNaN(msB)) return 0;

  const deltaMs = Math.abs(msA - msB);
  const horizonMs = horizonDays * 24 * 60 * 60 * 1000;
  const deltaRatio = deltaMs / horizonMs;

  return Math.exp(-deltaRatio);
}

// ============================================
// LIST METRICS
// ============================================

/**
 * Jaccard similarity coefficient for sets
 * @param listA First list
 * @param listB Second list
 * @returns Jaccard similarity [0, 1]
 */
export function jaccardSimilarity<T>(
  listA: T[] = [],
  listB: T[] = []
): number {
  if (listA.length === 0 && listB.length === 0) return 1;

  const setA = new Set(listA);
  const setB = new Set(listB);

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Cosine similarity for count vectors
 * @param listA First list
 * @param listB Second list
 * @returns Cosine similarity [0, 1]
 */
export function cosineSimilarityLists<T>(
  listA: T[] = [],
  listB: T[] = []
): number {
  const allItems = new Set([...listA, ...listB]);

  if (allItems.size === 0) return 1;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const item of allItems) {
    const countA = listA.filter(x => x === item).length;
    const countB = listB.filter(x => x === item).length;

    dotProduct += countA * countB;
    normA += countA * countA;
    normB += countB * countB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  return denominator > 0 ? dotProduct / denominator : 0;
}

// ============================================
// NUMERIC METRICS
// ============================================

/**
 * Z-score exponential similarity
 * @param valueA First value
 * @param valueB Second value
 * @param mean Population mean
 * @param stdDev Population standard deviation
 * @param temperature Temperature parameter for exponential decay
 * @returns Z-exp similarity [0, 1]
 */
export function zExpSimilarity(
  valueA: number,
  valueB: number,
  mean: number,
  stdDev: number,
  temperature: number = 1
): number {
  if (stdDev === 0) return valueA === valueB ? 1 : 0;

  const zA = (valueA - mean) / stdDev;
  const zB = (valueB - mean) / stdDev;
  const diff = Math.abs(zA - zB);

  return Math.exp(-diff / temperature);
}

/**
 * Min-max normalized similarity
 * @param valueA First value
 * @param valueB Second value
 * @param min Minimum value in range
 * @param max Maximum value in range
 * @returns Min-max similarity [0, 1]
 */
export function minMaxSimilarity(
  valueA: number,
  valueB: number,
  min: number,
  max: number
): number {
  if (max === min) return valueA === valueB ? 1 : 0;

  const range = max - min;
  const diff = Math.abs(valueA - valueB);

  return 1 - (diff / range);
}

/**
 * Ratio similarity - for positive values
 * @param valueA First value
 * @param valueB Second value
 * @returns Ratio similarity [0, 1]
 */
export function ratioSimilarity(
  valueA: number,
  valueB: number
): number {
  if (valueA <= 0 || valueB <= 0) return 0;

  return Math.min(valueA, valueB) / Math.max(valueA, valueB);
}

// ============================================
// STRING METRICS
// ============================================

/**
 * Levenshtein distance between two strings
 * @param strA First string
 * @param strB Second string
 * @returns Edit distance
 */
function levenshteinDistance(strA: string, strB: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= strB.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= strA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= strB.length; i++) {
    for (let j = 1; j <= strA.length; j++) {
      if (strB.charAt(i - 1) === strA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitution
          matrix[i][j - 1] + 1,       // insertion
          matrix[i - 1][j] + 1        // deletion
        );
      }
    }
  }

  return matrix[strB.length][strA.length];
}

/**
 * Normalized Levenshtein similarity
 * @param strA First string
 * @param strB Second string
 * @returns Levenshtein similarity [0, 1]
 */
export function levenshteinSimilarity(
  strA: string = '',
  strB: string = ''
): number {
  if (strA === strB) return 1;

  const maxLen = Math.max(strA.length, strB.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(strA, strB);

  return 1 - (distance / maxLen);
}

/**
 * N-gram similarity
 * @param strA First string
 * @param strB Second string
 * @param n N-gram size
 * @returns N-gram similarity [0, 1]
 */
export function ngramSimilarity(
  strA: string = '',
  strB: string = '',
  n: number = 2
): number {
  if (strA === strB) return 1;
  if (strA.length < n || strB.length < n) return 0;

  const getNgrams = (str: string): Set<string> => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.substr(i, n));
    }
    return ngrams;
  };

  const ngramsA = getNgrams(strA.toLowerCase());
  const ngramsB = getNgrams(strB.toLowerCase());

  return jaccardSimilarity([...ngramsA], [...ngramsB]);
}

// ============================================
// TEXT METRICS
// ============================================

/**
 * TF-IDF corpus builder
 */
export class TFIDFCorpus {
  private documents: string[] = [];
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments: number = 0;

  /**
   * Add document to corpus
   * @param text Document text
   */
  addDocument(text: string): void {
    this.documents.push(text);
    this.totalDocuments++;

    const tokens = this.tokenize(text);
    const uniqueTokens = new Set(tokens);

    for (const token of uniqueTokens) {
      const freq = this.documentFrequency.get(token) || 0;
      this.documentFrequency.set(token, freq + 1);
    }
  }

  /**
   * Tokenize text
   * @param text Text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate TF-IDF vector for text
   * @param text Input text
   * @returns TF-IDF vector
   */
  getTFIDFVector(text: string): Map<string, number> {
    const tokens = this.tokenize(text);
    const termFrequency = new Map<string, number>();

    // Calculate term frequency
    for (const token of tokens) {
      const freq = termFrequency.get(token) || 0;
      termFrequency.set(token, freq + 1);
    }

    // Calculate TF-IDF
    const tfidfVector = new Map<string, number>();
    const docLength = tokens.length;

    for (const [term, freq] of termFrequency) {
      const tf = freq / docLength;
      const df = this.documentFrequency.get(term) || 0;
      const idf = Math.log((this.totalDocuments + 1) / (df + 1));
      tfidfVector.set(term, tf * idf);
    }

    return tfidfVector;
  }

  /**
   * Calculate cosine similarity between two texts
   * @param textA First text
   * @param textB Second text
   * @returns Cosine similarity [0, 1]
   */
  cosineSimilarity(textA: string, textB: string): number {
    const vectorA = this.getTFIDFVector(textA);
    const vectorB = this.getTFIDFVector(textB);

    // Get all terms
    const allTerms = new Set([...vectorA.keys(), ...vectorB.keys()]);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const term of allTerms) {
      const valueA = vectorA.get(term) || 0;
      const valueB = vectorB.get(term) || 0;

      dotProduct += valueA * valueB;
      normA += valueA * valueA;
      normB += valueB * valueB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    return denominator > 0 ? dotProduct / denominator : 0;
  }
}

// ============================================
// BIPARTITE METRICS
// ============================================

/**
 * Bipartite matching - capabilities to needs
 * @param capsA Capabilities of actor A
 * @param needsB Needs of actor B
 * @returns Match score [0, 1]
 */
export function bipartiteCapToNeed(
  capsA: string[] = [],
  needsB: string[] = []
): number {
  if (needsB.length === 0) return 0;

  const intersection = capsA.filter(cap => needsB.includes(cap));

  return intersection.length / needsB.length;
}

/**
 * Bidirectional bipartite matching
 * @param capsA Capabilities of actor A
 * @param needsA Needs of actor A
 * @param capsB Capabilities of actor B
 * @param needsB Needs of actor B
 * @returns Max of both directions [0, 1]
 */
export function bipartiteBidirectional(
  capsA: string[] = [],
  needsA: string[] = [],
  capsB: string[] = [],
  needsB: string[] = []
): number {
  const aToB = bipartiteCapToNeed(capsA, needsB);
  const bToA = bipartiteCapToNeed(capsB, needsA);

  return Math.max(aToB, bToA);
}

// ============================================
// CONTEXT METRICS
// ============================================

/**
 * Stage complementarity score
 * @param stageA Stage of actor A
 * @param stageB Stage of actor B
 * @returns Complement score [0, 1]
 */
export function stageComplement(
  stageA: string,
  stageB: string
): number {
  const complementMap: Record<string, number> = {
    'Startup-Investor': 1.0,
    'Startup-Publisher': 0.8,
    'Startup-Enterprise': 0.7,
    'Scale-Investor': 0.8,
    'Scale-Publisher': 0.9,
    'Scale-Enterprise': 0.7,
    'Enterprise-Startup': 0.4,
    'Enterprise-Scale': 0.6,
    'Enterprise-Enterprise': 0.5
  };

  const key = `${stageA}-${stageB}`;
  const reverseKey = `${stageB}-${stageA}`;

  return complementMap[key] || complementMap[reverseKey] || 0.5;
}

/**
 * Role intent score
 * @param roleA Role of actor A
 * @param typeB Type of actor B
 * @returns Intent score [0, 1]
 */
export function roleIntent(
  roleA: string[],
  typeB: string
): number {
  const intentMap: Record<string, string[]> = {
    'Developer': ['sponsor', 'publisher', 'tooling'],
    'Publisher': ['developer', 'startup', 'scale'],
    'Investor': ['startup', 'scale', 'developer'],
    'ToolVendor': ['developer', 'company', 'enterprise'],
    'Brand': ['publisher', 'sponsor', 'enterprise']
  };

  let maxScore = 0;

  for (const role of roleA) {
    const preferredTypes = intentMap[role] || [];
    if (preferredTypes.includes(typeB.toLowerCase())) {
      maxScore = Math.max(maxScore, 1);
    } else if (preferredTypes.some(t => typeB.toLowerCase().includes(t))) {
      maxScore = Math.max(maxScore, 0.7);
    }
  }

  return maxScore || 0.3; // Base score for any connection
}

// ============================================
// SCAN METRICS
// ============================================

/**
 * Scan recency boost
 * @param scanTime Time of scan
 * @param currentTime Current time
 * @param decayHours Hours for exponential decay
 * @returns Recency boost [0, 1]
 */
export function scanRecencyBoost(
  scanTime: Date | string | number | null,
  currentTime: Date | string | number = Date.now(),
  decayHours: number = 48
): number {
  if (!scanTime) return 0;

  const scanMs = new Date(scanTime).getTime();
  const currentMs = new Date(currentTime).getTime();

  if (isNaN(scanMs) || isNaN(currentMs)) return 0;

  const deltaHours = Math.abs(currentMs - scanMs) / (1000 * 60 * 60);

  return Math.exp(-deltaHours / decayHours);
}

// ============================================
// AVAILABILITY METRICS
// ============================================

/**
 * Availability overlap score
 * @param availA Availability slots of actor A
 * @param availB Availability slots of actor B
 * @returns Overlap score [0, 1]
 */
export function availabilityOverlap(
  availA: Array<{ day: string; slots: string[] }> = [],
  availB: Array<{ day: string; slots: string[] }> = []
): number {
  if (availA.length === 0 || availB.length === 0) return 0;

  const slotsA = new Set<string>();
  const slotsB = new Set<string>();

  for (const dayAvail of availA) {
    for (const slot of dayAvail.slots) {
      slotsA.add(`${dayAvail.day}_${slot}`);
    }
  }

  for (const dayAvail of availB) {
    for (const slot of dayAvail.slots) {
      slotsB.add(`${dayAvail.day}_${slot}`);
    }
  }

  const intersection = new Set([...slotsA].filter(x => slotsB.has(x)));
  const minSlots = Math.min(slotsA.size, slotsB.size);

  return minSlots > 0 ? intersection.size / minSlots : 0;
}

// ============================================
// LOCATION METRICS
// ============================================

/**
 * Location preference fit
 * @param prefsA Location preferences of actor A
 * @param locationB Location of actor B
 * @returns Fit score [0, 1]
 */
export function locationFit(
  prefsA: string[] = [],
  locationB: string = ''
): number {
  if (prefsA.length === 0) return 0.5; // Neutral if no preferences

  if (prefsA.includes(locationB)) return 1;

  // Partial matches
  for (const pref of prefsA) {
    if (locationB.toLowerCase().includes(pref.toLowerCase()) ||
        pref.toLowerCase().includes(locationB.toLowerCase())) {
      return 0.7;
    }
  }

  return 0.3; // Low score for no match
}

// ============================================
// COMPOSITE METRICS
// ============================================

/**
 * Calculate all metrics for a pair of actors
 * @param actorA First actor
 * @param actorB Second actor
 * @param corpus TF-IDF corpus
 * @returns Object with all metric scores
 */
export function calculateAllMetrics(
  actorA: any,
  actorB: any,
  corpus?: TFIDFCorpus
): Record<string, number> {
  const metrics: Record<string, number> = {};

  // Date metrics
  if (actorA.dates?.created && actorB.dates?.created) {
    metrics['date:Created.prox'] = dateProximity(actorA.dates.created, actorB.dates.created);
  }

  // List metrics
  if (actorA.platforms && actorB.platforms) {
    metrics['list:Platforms.jaccard'] = jaccardSimilarity(actorA.platforms, actorB.platforms);
  }

  if (actorA.markets && actorB.markets) {
    metrics['list:Markets.jaccard'] = jaccardSimilarity(actorA.markets, actorB.markets);
  }

  if (actorA.categories && actorB.categories) {
    metrics['list:Categories.jaccard'] = jaccardSimilarity(actorA.categories, actorB.categories);
  }

  if (actorA.tags && actorB.tags) {
    metrics['list:Tags.cosine'] = cosineSimilarityLists(actorA.tags, actorB.tags);
  }

  // String metrics
  if (actorA.name && actorB.name) {
    metrics['str:Name.lev'] = levenshteinSimilarity(actorA.name, actorB.name);
  }

  // Text metrics
  if (corpus && actorA.text?.description && actorB.text?.description) {
    metrics['text:Description.cosine_tfidf'] = corpus.cosineSimilarity(
      actorA.text.description,
      actorB.text.description
    );
  }

  // Bipartite metrics
  if (actorA.capabilities || actorA.needs || actorB.capabilities || actorB.needs) {
    metrics['bipartite:cap→need'] = bipartiteBidirectional(
      actorA.capabilities,
      actorA.needs,
      actorB.capabilities,
      actorB.needs
    );
  }

  // Context metrics
  if (actorA.stage && actorB.stage) {
    metrics['ctx:stage.complement'] = stageComplement(actorA.stage, actorB.stage);
  }

  if (actorA.role && actorB.actorType) {
    metrics['ctx:role.intent'] = roleIntent(actorA.role, actorB.actorType);
  }

  // Filter out zero scores
  return Object.fromEntries(
    Object.entries(metrics).filter(([_, value]) => value > 0)
  );
}

// ============================================
// STATISTICS HELPERS
// ============================================

/**
 * Calculate mean of array
 * @param values Array of numbers
 * @returns Mean value
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation of array
 * @param values Array of numbers
 * @returns Standard deviation
 */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);

  return Math.sqrt(avgSquareDiff);
}