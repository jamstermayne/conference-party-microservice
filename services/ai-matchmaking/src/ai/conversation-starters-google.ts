/**
 * AI-Powered Conversation Starters - Google Vertex AI
 * Using Google's Gemini Pro for conversation generation
 */

import { VertexAI } from '@google-cloud/aiplatform';
import { Profile } from '../models/profile';
import { MatchResult } from '../models/match';
import { logger } from '../utils/logger';
import { Firestore } from '@google-cloud/firestore';

export class ConversationStarterGenerator {
  private vertexAI: VertexAI;
  private firestore: Firestore;
  private model: any;

  constructor() {
    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
    });

    // Use Gemini Pro model
    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });

    // Initialize Firestore for caching
    this.firestore = new Firestore();
  }

  /**
   * Generate personalized conversation starters using Gemini
   */
  async generateStarters(
    sourceProfile: Profile,
    targetProfile: Profile,
    matchResult: MatchResult
  ): Promise<string[]> {
    try {
      // Check Firestore cache first
      const cacheKey = `starters_${sourceProfile.id}_${targetProfile.id}`;
      const cacheDoc = await this.firestore
        .collection('conversation_starters_cache')
        .doc(cacheKey)
        .get();

      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        if (cached?.timestamp > Date.now() - 3600000) { // 1 hour cache
          return cached.starters;
        }
      }

      // Build prompt for Gemini
      const prompt = this.buildPrompt(sourceProfile, targetProfile, matchResult);
      
      // Generate with Gemini Pro
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse the response
      const starters = this.parseStarters(text) || 
                       this.getFallbackStarters(sourceProfile, targetProfile);

      // Cache in Firestore
      await this.firestore
        .collection('conversation_starters_cache')
        .doc(cacheKey)
        .set({
          starters,
          timestamp: Date.now(),
          sourceId: sourceProfile.id,
          targetId: targetProfile.id,
        });

      logger.info('Generated conversation starters with Gemini', {
        sourceId: sourceProfile.id,
        targetId: targetProfile.id,
        count: starters.length
      });

      return starters;
    } catch (error) {
      logger.error('Failed to generate conversation starters', { error });
      return this.getFallbackStarters(sourceProfile, targetProfile);
    }
  }

  /**
   * Build prompt for Gemini
   */
  private buildPrompt(
    source: Profile,
    target: Profile,
    match: MatchResult
  ): string {
    return `You are an expert networking coach at a professional conference.

Generate 5 personalized conversation starters for Person A to approach Person B.

Person A (Initiating):
- Name: ${source.name}
- Company: ${source.company || 'Not specified'}
- Role: ${source.title || 'Not specified'}
- Industry: ${source.industry || 'Not specified'}
- Interests: ${source.interests?.join(', ') || 'Not specified'}
- Skills: ${source.skills?.join(', ') || 'Not specified'}
- Goals: ${source.goals?.join(', ') || 'Not specified'}
- Looking for: ${source.lookingFor?.join(', ') || 'Not specified'}

Person B (Target):
- Name: ${target.name}
- Company: ${target.company || 'Not specified'}
- Role: ${target.title || 'Not specified'}
- Industry: ${target.industry || 'Not specified'}
- Interests: ${target.interests?.join(', ') || 'Not specified'}
- Skills: ${target.skills?.join(', ') || 'Not specified'}
- Goals: ${target.goals?.join(', ') || 'Not specified'}
- Looking for: ${target.lookingFor?.join(', ') || 'Not specified'}

Match Reasons:
${match.reasons?.join('\n') || 'High compatibility score'}

Requirements:
- Professional yet friendly tone
- Based on shared interests or complementary skills
- Specific and actionable
- Likely to lead to meaningful business discussions
- Culturally sensitive and appropriate

Format your response as a numbered list:
1. [First conversation starter]
2. [Second conversation starter]
3. [Third conversation starter]
4. [Fourth conversation starter]
5. [Fifth conversation starter]`;
  }

  /**
   * Parse starters from Gemini response
   */
  private parseStarters(text: string): string[] | null {
    try {
      // Extract numbered list items
      const lines = text.split('\n');
      const starters: string[] = [];
      
      for (const line of lines) {
        const match = line.match(/^\d+\.\s+(.+)/);
        if (match) {
          starters.push(match[1].trim());
        }
      }

      return starters.length >= 3 ? starters.slice(0, 5) : null;
    } catch (error) {
      logger.error('Failed to parse Gemini response', { error });
      return null;
    }
  }

  /**
   * Fallback conversation starters
   */
  private getFallbackStarters(source: Profile, target: Profile): string[] {
    const starters: string[] = [];

    // Industry-based starter
    if (target.industry) {
      starters.push(
        `Hi ${target.name}, I noticed you're in ${target.industry}. I'm curious about your perspective on the latest trends in the field.`
      );
    }

    // Company-based starter
    if (target.company) {
      starters.push(
        `Hi ${target.name}, I've been following ${target.company}'s work. Would love to hear about what you're working on there.`
      );
    }

    // Interest-based starter
    const sharedInterest = source.interests?.find(i => 
      target.interests?.includes(i)
    );
    if (sharedInterest) {
      starters.push(
        `Hi ${target.name}, I see we both share an interest in ${sharedInterest}. What's your take on recent developments?`
      );
    }

    // Goal-based starter
    const sharedGoal = source.goals?.find(g => 
      target.goals?.includes(g)
    );
    if (sharedGoal) {
      starters.push(
        `Hi ${target.name}, looks like we're both here for ${sharedGoal}. How's your conference experience so far?`
      );
    }

    // Generic professional starter
    starters.push(
      `Hi ${target.name}, great to connect! What brings you to the conference?`
    );

    return starters.slice(0, 5);
  }

  /**
   * Generate follow-up suggestions using Gemini
   */
  async generateFollowUps(
    conversationHistory: string[],
    sourceProfile: Profile,
    targetProfile: Profile
  ): Promise<string[]> {
    try {
      const prompt = `Based on this professional conversation at a conference, suggest 3 follow-up topics or questions that could deepen the business discussion and lead to potential collaboration.

Conversation so far:
${conversationHistory.join('\n')}

Generate 3 follow-up suggestions as a numbered list.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      const suggestions = this.parseStarters(text)?.slice(0, 3) || [
        'What are your main challenges in this area?',
        'How do you see this evolving in the next year?',
        'Would you be interested in exploring potential synergies?'
      ];

      return suggestions;
    } catch (error) {
      logger.error('Failed to generate follow-ups', { error });
      return [
        'What are your main challenges in this area?',
        'How do you see this evolving in the next year?',
        'Would you be interested in exploring potential synergies?'
      ];
    }
  }

  /**
   * Analyze conversation quality using Gemini
   */
  async analyzeConversationQuality(
    conversationHistory: string[]
  ): Promise<{
    score: number;
    insights: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Analyze this professional networking conversation and provide:
1. Quality score (0-100)
2. Three key insights about the interaction
3. Three suggestions for improvement

Conversation:
${conversationHistory.join('\n')}

Format your response as:
Score: [number]
Insights:
- [insight 1]
- [insight 2]
- [insight 3]
Suggestions:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      return this.parseAnalysis(text) || {
        score: 70,
        insights: ['Unable to analyze at this time'],
        suggestions: ['Keep the conversation flowing naturally']
      };
    } catch (error) {
      logger.error('Failed to analyze conversation', { error });
      return {
        score: 70,
        insights: ['Unable to analyze at this time'],
        suggestions: ['Keep the conversation flowing naturally']
      };
    }
  }

  /**
   * Parse analysis from Gemini response
   */
  private parseAnalysis(text: string): {
    score: number;
    insights: string[];
    suggestions: string[];
  } | null {
    try {
      const scoreMatch = text.match(/Score:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

      const insights: string[] = [];
      const suggestions: string[] = [];

      const lines = text.split('\n');
      let section = '';

      for (const line of lines) {
        if (line.includes('Insights:')) {
          section = 'insights';
        } else if (line.includes('Suggestions:')) {
          section = 'suggestions';
        } else if (line.startsWith('-')) {
          const content = line.substring(1).trim();
          if (section === 'insights') {
            insights.push(content);
          } else if (section === 'suggestions') {
            suggestions.push(content);
          }
        }
      }

      return { score, insights, suggestions };
    } catch (error) {
      logger.error('Failed to parse analysis', { error });
      return null;
    }
  }
}
