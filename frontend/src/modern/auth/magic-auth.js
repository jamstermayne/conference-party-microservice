/**
 * Magic Link Authentication System
 * Frictionless identity with progressive enhancement
 */

class MagicAuthSystem {
  constructor() {
    this.actionCodeSettings = {
      url: `${window.location.origin}/auth/verify`,
      handleCodeInApp: true,
      dynamicLinkDomain: 'conferenceapp.page.link'
    };
    
    this.profileCache = new Map();
    this.companyCache = new Map();
    
    // Feature detection
    this.supportsWebAuthn = window.PublicKeyCredential !== undefined;
    this.supportsPasskeys = this.checkPasskeySupport();
  }
  
  /**
   * Quick registration from URL parameters
   * Pre-fills form with data from invite links
   */
  async quickRegisterFromURL(url = window.location) {
    const params = new URLSearchParams(url.search);
    
    const registrationData = {
      email: params.get('email') || '',
      name: params.get('name') || '',
      company: params.get('company') || '',
      title: params.get('title') || '',
      source: params.get('source') || 'direct',
      eventId: params.get('event') || '',
      referralCode: params.get('ref') || '',
      linkedinProfile: params.get('li') || '',
      prefilledAt: new Date().toISOString()
    };
    
    // Store prefilled data for analytics
    this.trackPrefillSource(registrationData);
    
    // Auto-enhance if we have an email
    if (registrationData.email) {
      const enhanced = await this.enhanceFromEmail(registrationData.email);
      Object.assign(registrationData, enhanced);
    }
    
    return registrationData;
  }
  
  /**
   * Send magic link to email
   */
  async sendMagicLink(email, additionalData = {}) {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      // Check if user exists
      const existingUser = await this.checkUserExists(email);
      
      // Prepare magic link with context
      const actionUrl = new URL(this.actionCodeSettings.url);
      actionUrl.searchParams.set('email', email);
      actionUrl.searchParams.set('mode', existingUser ? 'signin' : 'signup');
      
      // Add any additional context
      Object.entries(additionalData).forEach(([key, value]) => {
        actionUrl.searchParams.set(key, value);
      });
      
      // Send via Firebase Auth (or custom implementation)
      if (window.firebase?.auth) {
        const auth = window.firebase.auth();
        await auth.sendSignInLinkToEmail(email, {
          ...this.actionCodeSettings,
          url: actionUrl.toString()
        });
      } else {
        // Fallback to custom API
        await this.sendMagicLinkViaAPI(email, actionUrl.toString());
      }
      
      // Store email for verification
      window.localStorage.setItem('emailForSignIn', email);
      
      return {
        success: true,
        email,
        isNewUser: !existingUser,
        message: `Magic link sent to ${email}`
      };
      
    } catch (error) {
      console.error('[MagicAuth] Send link error:', error);
      throw error;
    }
  }
  
  /**
   * Verify magic link on return
   */
  async verifyMagicLink(url = window.location.href) {
    try {
      const auth = window.firebase?.auth?.() || this.getAuthInstance();
      
      if (auth.isSignInWithEmailLink(url)) {
        // Get email from storage or prompt
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }
        
        // Sign in with the link
        const result = await auth.signInWithEmailLink(email, url);
        
        // Clear stored email
        window.localStorage.removeItem('emailForSignIn');
        
        // Get or create user profile
        const profile = await this.getOrCreateProfile(result.user);
        
        return {
          success: true,
          user: result.user,
          profile,
          isNewUser: result.additionalUserInfo?.isNewUser || false
        };
      }
      
      return {
        success: false,
        error: 'Invalid magic link'
      };
      
    } catch (error) {
      console.error('[MagicAuth] Verification error:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced profile from social login
   */
  async enhanceProfileFromSocial(provider) {
    try {
      let result;
      let profile = {};
      
      switch (provider) {
        case 'google':
          result = await this.signInWithGoogle();
          profile = await this.enrichFromGoogleProfile(result);
          break;
          
        case 'linkedin':
          result = await this.signInWithLinkedIn();
          profile = await this.enrichFromLinkedInProfile(result);
          break;
          
        case 'microsoft':
          result = await this.signInWithMicrosoft();
          profile = await this.enrichFromMicrosoftProfile(result);
          break;
          
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Save enhanced profile
      await this.saveEnhancedProfile(profile);
      
      return profile;
      
    } catch (error) {
      console.error(`[MagicAuth] Social login error (${provider}):`, error);
      throw error;
    }
  }
  
  /**
   * Google Sign-In
   */
  async signInWithGoogle() {
    if (window.firebase?.auth && window.firebase.auth.GoogleAuthProvider) {
      const auth = window.firebase.auth();
      const provider = new window.firebase.auth.GoogleAuthProvider();
      
      // Request additional scopes
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await auth.signInWithPopup(provider);
      return result;
    }
    
    // Fallback to Google Sign-In API
    return this.signInWithGoogleAPI();
  }
  
  /**
   * Enrich profile from Google data
   */
  async enrichFromGoogleProfile(result) {
    const user = result.user;
    const additionalInfo = result.additionalUserInfo;
    
    // Extract domain intelligence
    const emailDomain = user.email.split('@')[1];
    const companyInfo = await this.getCompanyFromDomain(emailDomain);
    
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      firstName: additionalInfo?.profile?.given_name || '',
      lastName: additionalInfo?.profile?.family_name || '',
      photoURL: user.photoURL,
      company: companyInfo.name,
      companyDomain: emailDomain,
      industry: companyInfo.industry,
      companySize: companyInfo.size,
      companyLogo: companyInfo.logo,
      estimatedTitle: await this.guessTitle(user.displayName, companyInfo),
      locale: additionalInfo?.profile?.locale || 'en',
      verified: user.emailVerified,
      provider: 'google',
      completionScore: this.calculateCompletionScore({
        name: !!user.displayName,
        email: !!user.email,
        company: !!companyInfo.name,
        title: false,
        photo: !!user.photoURL,
        bio: false,
        interests: false
      }),
      enrichedAt: new Date().toISOString()
    };
  }
  
  /**
   * Company intelligence from domain
   */
  async getCompanyFromDomain(domain) {
    // Check cache first
    if (this.companyCache.has(domain)) {
      return this.companyCache.get(domain);
    }
    
    // Common personal email domains
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (personalDomains.includes(domain.toLowerCase())) {
      return {
        name: 'Individual',
        industry: 'N/A',
        size: 'N/A',
        description: 'Personal email',
        logo: null
      };
    }
    
    try {
      // Try multiple enrichment sources
      let companyInfo = await this.tryCompanyAPIs(domain);
      
      if (!companyInfo) {
        // Fallback to domain parsing
        companyInfo = {
          name: this.guessCompanyFromDomain(domain),
          industry: 'Technology', // Default guess
          size: 'Unknown',
          description: '',
          logo: `https://logo.clearbit.com/${domain}`
        };
      }
      
      // Cache the result
      this.companyCache.set(domain, companyInfo);
      
      return companyInfo;
      
    } catch (error) {
      console.warn('[MagicAuth] Company enrichment failed:', error);
      
      return {
        name: this.guessCompanyFromDomain(domain),
        industry: 'Unknown',
        size: 'Unknown',
        description: '',
        logo: null
      };
    }
  }
  
  /**
   * Try multiple company enrichment APIs
   */
  async tryCompanyAPIs(domain) {
    // Try Clearbit first (if API key available)
    if (window.ENV?.CLEARBIT_API_KEY) {
      try {
        const response = await fetch(`https://company.clearbit.com/v1/domains/find?name=${domain}`, {
          headers: { 'Authorization': `Bearer ${window.ENV.CLEARBIT_API_KEY}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            name: data.name,
            industry: data.category?.industry || 'Unknown',
            size: data.metrics?.employees || 'Unknown',
            description: data.description || '',
            logo: data.logo
          };
        }
      } catch (error) {
        console.debug('[MagicAuth] Clearbit API failed:', error);
      }
    }
    
    // Try our own API
    try {
      const response = await fetch(`/api/company/${domain}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('[MagicAuth] Company API failed:', error);
    }
    
    return null;
  }
  
  /**
   * Guess company name from domain
   */
  guessCompanyFromDomain(domain) {
    // Remove common TLDs and clean up
    const name = domain
      .replace(/\.(com|org|net|io|co|ai|app|dev|tech)(\.[a-z]{2})?$/i, '')
      .replace(/[_-]/g, ' ')
      .split('.')
      .pop();
    
    // Capitalize words
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Guess job title based on name and company
   */
  async guessTitle(name, companyInfo) {
    // Common patterns in names that indicate roles
    const patterns = {
      'CEO': /\b(ceo|chief executive|founder)\b/i,
      'CTO': /\b(cto|chief technology|tech lead)\b/i,
      'Developer': /\b(developer|engineer|programmer|dev)\b/i,
      'Designer': /\b(designer|ux|ui|creative)\b/i,
      'Manager': /\b(manager|lead|head|director)\b/i,
      'Marketing': /\b(marketing|growth|acquisition)\b/i,
      'Sales': /\b(sales|business development|bd)\b/i
    };
    
    // Check LinkedIn if available
    // This would require LinkedIn API integration
    
    // Default based on company size
    if (companyInfo.size === 'Small' || companyInfo.size < 50) {
      return 'Team Member';
    } else if (companyInfo.size === 'Medium' || companyInfo.size < 500) {
      return 'Professional';
    } else {
      return 'Specialist';
    }
  }
  
  /**
   * Calculate profile completion score
   */
  calculateCompletionScore(fields) {
    const weights = {
      name: 0.2,
      email: 0.2,
      company: 0.15,
      title: 0.15,
      photo: 0.1,
      bio: 0.1,
      interests: 0.1
    };
    
    let score = 0;
    for (const [field, completed] of Object.entries(fields)) {
      if (completed && weights[field]) {
        score += weights[field];
      }
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Save enhanced profile
   */
  async saveEnhancedProfile(profile) {
    try {
      // Save to localStorage for quick access
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      // Save to backend
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      
      // Create matching profile for AI
      await this.createMatchingProfile(profile);
      
      // Emit event for other components
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: profile }));
      
      return profile;
      
    } catch (error) {
      console.error('[MagicAuth] Profile save error:', error);
      throw error;
    }
  }
  
  /**
   * Create AI matching profile
   */
  async createMatchingProfile(profile) {
    const matchingProfile = {
      userId: profile.uid,
      searchVector: await this.createSearchVector(profile),
      skills: await this.extractSkills(profile),
      interests: await this.extractInterests(profile),
      goals: [],
      availability: {
        preferredTimes: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      networkingStyle: await this.predictNetworkingStyle(profile),
      createdAt: new Date().toISOString()
    };
    
    // Save matching profile
    await fetch('/api/matching/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchingProfile)
    });
    
    return matchingProfile;
  }
  
  /**
   * Create search vector for AI matching
   */
  async createSearchVector(profile) {
    // Combine relevant fields for vectorization
    const text = [
      profile.name,
      profile.title,
      profile.company,
      profile.industry,
      profile.bio || ''
    ].filter(Boolean).join(' ');
    
    // This would use a real embedding API in production
    return this.simpleVectorize(text);
  }
  
  /**
   * Simple vectorization (placeholder for real embedding)
   */
  simpleVectorize(text) {
    // Simple hash-based vector for demo
    const vector = new Array(128).fill(0);
    for (let i = 0; i < text.length; i++) {
      const index = text.charCodeAt(i) % 128;
      vector[index] += 1;
    }
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
  
  /**
   * Extract skills from profile
   */
  async extractSkills(profile) {
    const skills = [];
    
    // Extract from title
    if (profile.title) {
      const titleSkills = this.extractSkillsFromTitle(profile.title);
      skills.push(...titleSkills);
    }
    
    // Extract from company/industry
    if (profile.industry) {
      const industrySkills = this.getIndustrySkills(profile.industry);
      skills.push(...industrySkills);
    }
    
    return [...new Set(skills)]; // Remove duplicates
  }
  
  /**
   * Extract skills from job title
   */
  extractSkillsFromTitle(title) {
    const skillMap = {
      'developer': ['JavaScript', 'Programming', 'Software Development'],
      'designer': ['UI/UX', 'Design', 'Figma'],
      'manager': ['Leadership', 'Project Management', 'Strategy'],
      'engineer': ['Engineering', 'Problem Solving', 'Technical'],
      'marketing': ['Marketing', 'Growth', 'Analytics'],
      'sales': ['Sales', 'Business Development', 'Negotiation']
    };
    
    const skills = [];
    const lowerTitle = title.toLowerCase();
    
    for (const [key, values] of Object.entries(skillMap)) {
      if (lowerTitle.includes(key)) {
        skills.push(...values);
      }
    }
    
    return skills;
  }
  
  /**
   * Get common skills for industry
   */
  getIndustrySkills(industry) {
    const industrySkills = {
      'Technology': ['Innovation', 'Digital Transformation', 'Agile'],
      'Gaming': ['Game Development', 'Entertainment', 'User Experience'],
      'Finance': ['Financial Analysis', 'Risk Management', 'Compliance'],
      'Healthcare': ['Healthcare', 'Patient Care', 'Medical Technology'],
      'Education': ['Teaching', 'Learning', 'Curriculum Development']
    };
    
    return industrySkills[industry] || ['Professional Skills'];
  }
  
  /**
   * Extract interests from profile
   */
  async extractInterests(profile) {
    const interests = [];
    
    // Based on industry
    if (profile.industry) {
      interests.push(profile.industry);
    }
    
    // Based on company type
    if (profile.companySize === 'Small' || profile.companySize < 50) {
      interests.push('Startups', 'Entrepreneurship');
    } else if (profile.companySize > 1000) {
      interests.push('Enterprise', 'Scale');
    }
    
    return interests;
  }
  
  /**
   * Predict networking style
   */
  async predictNetworkingStyle(profile) {
    // Simple heuristic based on profile
    if (profile.title?.toLowerCase().includes('sales') || 
        profile.title?.toLowerCase().includes('business')) {
      return 'active_networker';
    }
    
    if (profile.title?.toLowerCase().includes('engineer') || 
        profile.title?.toLowerCase().includes('developer')) {
      return 'selective_networker';
    }
    
    if (profile.title?.toLowerCase().includes('executive') || 
        profile.title?.toLowerCase().includes('director')) {
      return 'strategic_networker';
    }
    
    return 'casual_networker';
  }
  
  /**
   * Check if email is valid
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Check if user exists
   */
  async checkUserExists(email) {
    try {
      const response = await fetch(`/api/users/exists?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
    } catch (error) {
      console.error('[MagicAuth] User check error:', error);
    }
    return false;
  }
  
  /**
   * Check passkey support
   */
  checkPasskeySupport() {
    if (!window.PublicKeyCredential) return false;
    
    // Check for conditional mediation (passkey autofill)
    if (window.PublicKeyCredential.isConditionalMediationAvailable) {
      return window.PublicKeyCredential.isConditionalMediationAvailable();
    }
    
    return true;
  }
  
  /**
   * Track prefill source for analytics
   */
  trackPrefillSource(data) {
    if (window.gtag) {
      window.gtag('event', 'registration_prefill', {
        source: data.source,
        has_email: !!data.email,
        has_name: !!data.name,
        has_company: !!data.company,
        referral_code: data.referralCode || 'none'
      });
    }
  }
  
  /**
   * Get or create user profile
   */
  async getOrCreateProfile(user) {
    try {
      // Try to get existing profile
      const response = await fetch(`/api/users/${user.uid}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Create new profile
      const newProfile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        onboardingCompleted: false
      };
      
      await this.saveEnhancedProfile(newProfile);
      return newProfile;
      
    } catch (error) {
      console.error('[MagicAuth] Profile error:', error);
      throw error;
    }
  }
  
  /**
   * Send magic link via custom API
   */
  async sendMagicLinkViaAPI(email, actionUrl) {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, actionUrl })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send magic link');
    }
    
    return await response.json();
  }
  
  /**
   * Get auth instance (fallback)
   */
  getAuthInstance() {
    // Return a mock auth object for development
    return {
      isSignInWithEmailLink: (url) => url.includes('mode=signIn'),
      signInWithEmailLink: async (email, url) => {
        // Mock sign in
        return {
          user: {
            uid: 'mock_' + Date.now(),
            email: email,
            displayName: email.split('@')[0]
          },
          additionalUserInfo: {
            isNewUser: true
          }
        };
      }
    };
  }
}

// Export the class
export { MagicAuthSystem };

// Also export as default
export default MagicAuthSystem;