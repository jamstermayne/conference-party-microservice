/**
 * AI-Powered Conversation Starters
 * Generates personalized ice-breakers using GPT-4
 */

import OpenAI from 'openai';
import { Profile } from '../models/profile';
import { MatchResult } from '../models/match';
import { logger } from '../utils/logger';
import { CacheService } from '../services/cache-service';

export class ConversationStarterGenerator {
  private openai: OpenAI;
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.cache = cache;
  }

  /**
   * Generate personalized conversation starters for a match
   */
  async generateStarters(
    sourceProfile: Profile,
    targetProfile: Profile,
    matchResult: MatchResult
  ): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `starters:${sourceProfile.id}:${targetProfile.id}`;
      const cached = await this.cache.get<string[]>(cacheKey);
      if (cached) return cached;

      // Build context for GPT-4
      const context = this.buildContext(sourceProfile, targetProfile, matchResult);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert networking coach at a professional conference. 
Generate 5 personalized conversation starters that are:
- Professional yet friendly
- Based on shared interests or complementary skills
- Specific and actionable
- Likely to lead to meaningful business discussions
- Culturally sensitive and appropriate`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const starters = response.starters || this.getFallbackStarters(sourceProfile, targetProfile);

      // Cache for 1 hour
      await this.cache.set(cacheKey, starters, 3600);

      logger.info('Generated conversation starters', {
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
   * Build context for GPT-4
   */
  private buildContext(
    source: Profile,
    target: Profile,
    match: MatchResult
  ): string {
    return `
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

Generate 5 conversation starters for Person A to approach Person B.
Return as JSON: { "starters": ["starter1", "starter2", ...] }
`;
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
   * Generate follow-up suggestions based on conversation
   */
  async generateFollowUps(
    conversationHistory: string[],
    sourceProfile: Profile,
    targetProfile: Profile
  ): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a professional conversation at a conference.
Based on the conversation so far, suggest 3 follow-up topics or questions
that could deepen the business discussion and lead to potential collaboration.`
          },
          {
            role: 'user',
            content: `Conversation so far:\n${conversationHistory.join('\n')}\n\nGenerate 3 follow-up suggestions.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const suggestions = completion.choices[0].message.content
        ?.split('\n')
        .filter(s => s.trim())
        .slice(0, 3) || [];

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
   * Analyze conversation quality
   */
  async analyzeConversationQuality(
    conversationHistory: string[]
  ): Promise<{
    score: number;
    insights: string[];
    suggestions: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze this professional networking conversation.
Provide:
1. Quality score (0-100)
2. Key insights about the interaction
3. Suggestions for improvement
Return as JSON.`
          },
          {
            role: 'user',
            content: conversationHistory.join('\n')
          }
        ],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('Failed to analyze conversation', { error });
      return {
        score: 70,
        insights: ['Unable to analyze at this time'],
        suggestions: ['Keep the conversation flowing naturally']
      };
    }
  }
}
