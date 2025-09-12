/**
 * Company Intelligence Service
 * Enriches company data from email domains using multiple data sources
 */

export class CompanyIntelligenceService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    
    // Configure API endpoints
    this.apis = {
      clearbit: {
        enabled: false, // Requires API key
        endpoint: 'https://company.clearbit.com/v2/companies/find',
        key: null
      },
      brandfetch: {
        enabled: false, // Requires API key  
        endpoint: 'https://api.brandfetch.io/v2/brands',
        key: null
      },
      internal: {
        enabled: true,
        endpoint: '/api/company-intelligence'
      }
    };
    
    // Known gaming/tech companies (fallback data)
    this.knownCompanies = {
      'ea.com': {
        name: 'Electronic Arts',
        domain: 'ea.com',
        logo: 'https://www.ea.com/assets/images/ea-logo.svg',
        industry: 'Gaming',
        size: '10000+',
        description: 'Leading video game publisher',
        tags: ['AAA', 'Publisher', 'Global']
      },
      'ubisoft.com': {
        name: 'Ubisoft',
        domain: 'ubisoft.com',
        logo: 'https://staticctf.akamaized.net/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5EGST0AXiFb5bqOr9nHUBj/8e89124741e13e09e93f64e8b45b526f/ubi-homelogo.svg',
        industry: 'Gaming',
        size: '10000+',
        description: 'Global game developer and publisher',
        tags: ['AAA', 'Developer', 'Publisher']
      },
      'activision.com': {
        name: 'Activision Blizzard',
        domain: 'activision.com',
        logo: 'https://www.activisionblizzard.com/content/dam/atvi/global/firstparty/atvi/logo.svg',
        industry: 'Gaming',
        size: '10000+',
        description: 'One of the largest game companies',
        tags: ['AAA', 'Publisher', 'Esports']
      },
      'microsoft.com': {
        name: 'Microsoft',
        domain: 'microsoft.com',
        logo: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b',
        industry: 'Technology',
        size: '100000+',
        description: 'Global technology corporation',
        tags: ['Platform', 'Xbox', 'Cloud']
      },
      'sony.com': {
        name: 'Sony Interactive Entertainment',
        domain: 'sony.com',
        logo: 'https://www.sony.com/en/template/2020/en/img/logo.svg',
        industry: 'Gaming',
        size: '10000+',
        description: 'PlayStation platform holder',
        tags: ['Platform', 'PlayStation', 'Hardware']
      },
      'nintendo.com': {
        name: 'Nintendo',
        domain: 'nintendo.com',
        logo: 'https://www.nintendo.com/content/dam/noa/global/logos/nintendo-logo-red.svg',
        industry: 'Gaming',
        size: '5000+',
        description: 'Gaming hardware and software company',
        tags: ['Platform', 'Developer', 'Hardware']
      },
      'unity.com': {
        name: 'Unity Technologies',
        domain: 'unity.com',
        logo: 'https://unity.com/logo-unity-web.png',
        industry: 'Game Technology',
        size: '5000+',
        description: 'Real-time 3D development platform',
        tags: ['Engine', 'Tools', 'Platform']
      },
      'unrealengine.com': {
        name: 'Epic Games',
        domain: 'unrealengine.com',
        logo: 'https://cdn2.unrealengine.com/epic-games-logo.svg',
        industry: 'Gaming',
        size: '5000+',
        description: 'Unreal Engine and Fortnite developer',
        tags: ['Engine', 'Developer', 'Platform']
      }
    };
  }
  
  /**
   * Get company information from email domain
   */
  async getCompanyFromEmail(email) {
    if (!email || !email.includes('@')) {
      return null;
    }
    
    const domain = email.split('@')[1].toLowerCase();
    return this.getCompanyFromDomain(domain);
  }
  
  /**
   * Get company information from domain
   */
  async getCompanyFromDomain(domain) {
    // Check cache first
    if (this.cache.has(domain)) {
      return this.cache.get(domain);
    }
    
    // Check if request is already pending
    if (this.pendingRequests.has(domain)) {
      return this.pendingRequests.get(domain);
    }
    
    // Create pending request
    const request = this.fetchCompanyData(domain);
    this.pendingRequests.set(domain, request);
    
    try {
      const data = await request;
      this.cache.set(domain, data);
      this.pendingRequests.delete(domain);
      return data;
    } catch (error) {
      this.pendingRequests.delete(domain);
      throw error;
    }
  }
  
  /**
   * Fetch company data from available sources
   */
  async fetchCompanyData(domain) {
    // Try known companies first
    if (this.knownCompanies[domain]) {
      return {
        ...this.knownCompanies[domain],
        source: 'known',
        confidence: 1.0
      };
    }
    
    // Try internal API
    if (this.apis.internal.enabled) {
      try {
        const response = await fetch(`${this.apis.internal.endpoint}?domain=${domain}`);
        if (response.ok) {
          const data = await response.json();
          if (data.company) {
            return {
              ...data.company,
              source: 'internal',
              confidence: data.confidence || 0.8
            };
          }
        }
      } catch (error) {
        console.warn('[CompanyIntelligence] Internal API failed:', error);
      }
    }
    
    // Try Clearbit API (if configured)
    if (this.apis.clearbit.enabled && this.apis.clearbit.key) {
      try {
        const response = await fetch(
          `${this.apis.clearbit.endpoint}?domain=${domain}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apis.clearbit.key}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            name: data.name,
            domain: data.domain,
            logo: data.logo,
            industry: data.category?.industry,
            size: data.metrics?.employees,
            description: data.description,
            tags: data.tags || [],
            source: 'clearbit',
            confidence: 0.9
          };
        }
      } catch (error) {
        console.warn('[CompanyIntelligence] Clearbit API failed:', error);
      }
    }
    
    // Fallback: Generate basic info from domain
    return this.generateBasicInfo(domain);
  }
  
  /**
   * Generate basic company info from domain
   */
  generateBasicInfo(domain) {
    // Extract company name from domain
    const parts = domain.split('.');
    const name = parts[0];
    
    // Capitalize first letter
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Guess industry based on common patterns
    let industry = 'Technology';
    let tags = [];
    
    if (domain.includes('game') || domain.includes('play')) {
      industry = 'Gaming';
      tags = ['Gaming'];
    } else if (domain.includes('studio')) {
      industry = 'Game Development';
      tags = ['Studio', 'Developer'];
    } else if (domain.includes('tech') || domain.includes('soft')) {
      industry = 'Technology';
      tags = ['Technology'];
    }
    
    return {
      name: displayName,
      domain: domain,
      logo: null,
      industry: industry,
      size: 'Unknown',
      description: `Company associated with ${domain}`,
      tags: tags,
      source: 'generated',
      confidence: 0.3
    };
  }
  
  /**
   * Enrich profile with company data
   */
  async enrichProfile(profile) {
    if (!profile.email) {
      return profile;
    }
    
    try {
      const company = await this.getCompanyFromEmail(profile.email);
      
      if (company && company.confidence > 0.5) {
        return {
          ...profile,
          company: company.name,
          companyDomain: company.domain,
          companyLogo: company.logo,
          industry: company.industry,
          companySize: company.size,
          companyTags: company.tags,
          enriched: true,
          enrichmentSource: company.source,
          enrichmentConfidence: company.confidence
        };
      }
    } catch (error) {
      console.error('[CompanyIntelligence] Enrichment failed:', error);
    }
    
    return profile;
  }
  
  /**
   * Batch enrich multiple profiles
   */
  async enrichProfiles(profiles) {
    const enrichmentPromises = profiles.map(profile => 
      this.enrichProfile(profile).catch(err => {
        console.error('[CompanyIntelligence] Profile enrichment failed:', err);
        return profile; // Return original on error
      })
    );
    
    return Promise.all(enrichmentPromises);
  }
  
  /**
   * Get industry insights
   */
  getIndustryInsights(industry) {
    const insights = {
      'Gaming': {
        trends: ['Mobile Gaming', 'Cloud Gaming', 'VR/AR', 'Esports'],
        skills: ['Unity', 'Unreal Engine', 'Game Design', 'Multiplayer'],
        events: ['GDC', 'Gamescom', 'E3', 'PAX']
      },
      'Game Development': {
        trends: ['Indie Games', 'Live Service', 'Cross-Platform', 'AI in Games'],
        skills: ['Programming', 'Art', 'Design', 'QA'],
        events: ['GDC', 'IndieCade', 'DICE Summit']
      },
      'Technology': {
        trends: ['AI/ML', 'Cloud Computing', 'Blockchain', 'Metaverse'],
        skills: ['Cloud', 'DevOps', 'Data Science', 'Security'],
        events: ['CES', 'TechCrunch Disrupt', 'Google I/O']
      }
    };
    
    return insights[industry] || {
      trends: [],
      skills: [],
      events: []
    };
  }
  
  /**
   * Match companies for networking opportunities
   */
  findNetworkingMatches(userCompany, attendeeCompanies) {
    const matches = [];
    
    for (const company of attendeeCompanies) {
      const score = this.calculateMatchScore(userCompany, company);
      
      if (score > 0.5) {
        matches.push({
          company,
          score,
          reasons: this.getMatchReasons(userCompany, company)
        });
      }
    }
    
    // Sort by score
    return matches.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Calculate match score between companies
   */
  calculateMatchScore(company1, company2) {
    let score = 0;
    
    // Same industry bonus
    if (company1.industry === company2.industry) {
      score += 0.3;
    }
    
    // Complementary industries
    const complementary = {
      'Gaming': ['Game Development', 'Technology'],
      'Game Development': ['Gaming', 'Technology'],
      'Technology': ['Gaming', 'Game Development']
    };
    
    if (complementary[company1.industry]?.includes(company2.industry)) {
      score += 0.5;
    }
    
    // Tag overlap
    const sharedTags = company1.tags?.filter(tag => 
      company2.tags?.includes(tag)
    ) || [];
    
    score += sharedTags.length * 0.1;
    
    // Size compatibility (prefer similar or complementary sizes)
    if (company1.size === company2.size) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Get reasons for match
   */
  getMatchReasons(company1, company2) {
    const reasons = [];
    
    if (company1.industry === company2.industry) {
      reasons.push(`Both in ${company1.industry}`);
    }
    
    const sharedTags = company1.tags?.filter(tag => 
      company2.tags?.includes(tag)
    ) || [];
    
    if (sharedTags.length > 0) {
      reasons.push(`Shared interests: ${sharedTags.join(', ')}`);
    }
    
    if (company1.size !== company2.size) {
      reasons.push('Potential partnership opportunity');
    }
    
    return reasons;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[CompanyIntelligence] Cache cleared');
  }
  
  /**
   * Configure API keys
   */
  configureAPIs(config) {
    if (config.clearbit) {
      this.apis.clearbit.key = config.clearbit;
      this.apis.clearbit.enabled = true;
    }
    
    if (config.brandfetch) {
      this.apis.brandfetch.key = config.brandfetch;
      this.apis.brandfetch.enabled = true;
    }
    
    console.log('[CompanyIntelligence] APIs configured');
  }
}

// Create singleton instance
export const companyIntelligence = new CompanyIntelligenceService();