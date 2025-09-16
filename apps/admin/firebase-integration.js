/**
 * Firebase Integration for Matchmaking Admin Dashboard
 * Connects admin UI to Firestore and Firebase Functions
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  addDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

// Firebase configuration (from conference-party-app)
const firebaseConfig = {
  apiKey: "AIzaSyBZCgyTsc1xvROmx5VSbH1gvkl3Rhzscnw",
  authDomain: "conference-party-app.firebaseapp.com",
  projectId: "conference-party-app",
  storageBucket: "conference-party-app.appspot.com",
  messagingSenderId: "581402041209",
  appId: "1:581402041209:web:d0e8c3e4b4f5f5f5e6e6e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

// For local development, connect to emulators
if (window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

/**
 * Firebase Service for Admin Dashboard
 */
export class FirebaseService {
  constructor() {
    this.db = db;
    this.functions = functions;
    this.listeners = [];
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Upload attendees via Firebase Function
   */
  async uploadAttendees(attendeeData, options = {}) {
    try {
      const uploadFunction = httpsCallable(this.functions, 'matchmaking-ingestAttendees');

      const result = await uploadFunction({
        attendees: attendeeData,
        dryRun: options.dryRun || false,
        source: options.source || 'admin-upload',
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('[Firebase] Upload error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Process badge scans
   */
  async processBadgeScans(scans) {
    try {
      const scanFunction = httpsCallable(this.functions, 'matchmaking-processScan');

      const results = await Promise.all(
        scans.map(scan => scanFunction({
          badgeId: scan.badgeId,
          scannerId: scan.scannerId,
          timestamp: scan.timestamp || new Date().toISOString(),
          location: scan.location
        }))
      );

      return {
        success: true,
        processed: results.length,
        results: results.map(r => r.data)
      };
    } catch (error) {
      console.error('[Firebase] Scan processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get actors (companies, sponsors, attendees) from Firestore
   */
  async getActors(filters = {}) {
    const cacheKey = `actors-${JSON.stringify(filters)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let q = collection(this.db, 'actors');

      // Apply filters
      if (filters.actorType) {
        q = query(q, where('actorType', '==', filters.actorType));
      }
      if (filters.hasConsent) {
        q = query(q, where('consent.matchmaking', '==', true));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const actors = [];

      snapshot.forEach(doc => {
        actors.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Cache result
      this.cache.set(cacheKey, {
        data: actors,
        timestamp: Date.now()
      });

      return actors;
    } catch (error) {
      console.error('[Firebase] Error fetching actors:', error);
      return [];
    }
  }

  /**
   * Get matches from Firestore
   */
  async getMatches(profileId = null, options = {}) {
    try {
      let matchData = [];

      if (profileId) {
        // Get matches for specific profile
        const matchesRef = collection(this.db, 'matches', profileId, 'pairs');
        let q = matchesRef;

        if (options.minScore) {
          q = query(q, where('score', '>=', options.minScore));
        }
        if (options.limit) {
          q = query(q, orderBy('score', 'desc'), limit(options.limit));
        }

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          matchData.push({
            id: doc.id,
            profileId,
            ...doc.data()
          });
        });
      } else {
        // Get all recent matches (for visualization)
        const globalMatchesRef = collection(this.db, 'globalMatches');
        const q = query(
          globalMatchesRef,
          orderBy('timestamp', 'desc'),
          limit(options.limit || 500)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          matchData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }

      return matchData;
    } catch (error) {
      console.error('[Firebase] Error fetching matches:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time actor updates
   */
  subscribeToActors(callback, filters = {}) {
    let q = collection(this.db, 'actors');

    if (filters.actorType) {
      q = query(q, where('actorType', '==', filters.actorType));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const actors = [];
      const changes = {
        added: [],
        modified: [],
        removed: []
      };

      snapshot.docChanges().forEach(change => {
        const data = {
          id: change.doc.id,
          ...change.doc.data()
        };

        if (change.type === 'added') {
          changes.added.push(data);
        } else if (change.type === 'modified') {
          changes.modified.push(data);
        } else if (change.type === 'removed') {
          changes.removed.push(data);
        }
      });

      snapshot.forEach(doc => {
        actors.push({
          id: doc.id,
          ...doc.data()
        });
      });

      callback(actors, changes);
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to real-time match updates
   */
  subscribeToMatches(callback, options = {}) {
    const globalMatchesRef = collection(this.db, 'globalMatches');
    const q = query(
      globalMatchesRef,
      orderBy('timestamp', 'desc'),
      limit(options.limit || 100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = [];
      const changes = {
        added: [],
        modified: [],
        removed: []
      };

      snapshot.docChanges().forEach(change => {
        const data = {
          id: change.doc.id,
          ...change.doc.data()
        };

        changes[change.type].push(data);
      });

      snapshot.forEach(doc => {
        matches.push({
          id: doc.id,
          ...doc.data()
        });
      });

      callback(matches, changes);
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get matchmaking statistics
   */
  async getStatistics() {
    try {
      const [actors, matches] = await Promise.all([
        this.getActors(),
        this.getMatches(null, { limit: 1000 })
      ]);

      const stats = {
        totalActors: actors.length,
        companies: actors.filter(a => a.actorType === 'company').length,
        sponsors: actors.filter(a => a.actorType === 'sponsor').length,
        attendees: actors.filter(a => a.actorType === 'attendee').length,
        withConsent: actors.filter(a => a.consent?.matchmaking).length,
        totalMatches: matches.length,
        avgScore: matches.length > 0
          ? matches.reduce((sum, m) => sum + (m.score || 0), 0) / matches.length
          : 0,
        scoreDistribution: this.calculateScoreDistribution(matches)
      };

      return stats;
    } catch (error) {
      console.error('[Firebase] Error fetching statistics:', error);
      return null;
    }
  }

  /**
   * Calculate score distribution for matches
   */
  calculateScoreDistribution(matches) {
    const bins = {
      '0.0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0
    };

    matches.forEach(match => {
      const score = match.score || 0;
      if (score <= 0.2) bins['0.0-0.2']++;
      else if (score <= 0.4) bins['0.2-0.4']++;
      else if (score <= 0.6) bins['0.4-0.6']++;
      else if (score <= 0.8) bins['0.6-0.8']++;
      else bins['0.8-1.0']++;
    });

    return bins;
  }

  /**
   * Trigger match calculation for specific actors
   */
  async calculateMatches(actorIds, options = {}) {
    try {
      const matchFunction = httpsCallable(this.functions, 'matchmaking-calculateMatches');

      const result = await matchFunction({
        actorIds,
        profile: options.profile || 'balanced',
        threshold: options.threshold || 0.3,
        limit: options.limit || 100
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('[Firebase] Match calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save meeting request
   */
  async requestMeeting(matchId, requestData) {
    try {
      const meetingRef = collection(this.db, 'meetingRequests');
      const docRef = await addDoc(meetingRef, {
        matchId,
        ...requestData,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      return {
        success: true,
        meetingId: docRef.id
      };
    } catch (error) {
      console.error('[Firebase] Meeting request error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    this.cache.clear();
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Expose to window for debugging
if (window.location.hostname === 'localhost') {
  window.firebaseDebug = {
    service: firebaseService,
    db,
    functions
  };
}