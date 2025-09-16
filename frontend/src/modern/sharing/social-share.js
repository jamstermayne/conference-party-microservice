/**
 * Social Share Component
 * Creates shareable content and social media integrations for conference insights
 */

class SocialShare {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? 
      document.getElementById(container) : container;
    this.options = {
      theme: options.theme || 'dark',
      platforms: options.platforms || ['linkedin', 'twitter', 'facebook', 'email'],
      includeImages: options.includeImages !== false,
      trackShares: options.trackShares !== false,
      customTemplates: options.customTemplates || {},
      ...options
    };
    
    this.reportData = null;
    this.shareableContent = new Map();
    this.generatedImages = new Map();
    this.shareTemplates = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize social share component
   */
  async initialize() {
    if (!this.container) {
      console.error('[SocialShare] Container not found');
      return;
    }
    
    try {
      await this.loadShareTemplates();
      this.render();
      console.log('[SocialShare] Initialized successfully');
    } catch (error) {
      console.error('[SocialShare] Initialization failed:', error);
      this.container.innerHTML = this.getErrorHTML(error.message);
    }
  }
  
  /**
   * Load share templates
   */
  async loadShareTemplates() {
    // LinkedIn templates
    this.shareTemplates.set('linkedin', {
      personal: {
        template: `🎯 Just wrapped up an incredible conference experience!\n\n✨ Key highlights:\n{highlights}\n\n🚀 Ready to put these insights into action and connect with amazing professionals I met.\n\n{hashtags}`,
        hashtags: '#Conference #Networking #ProfessionalGrowth #Innovation'
      },
      executive: {
        template: `📊 Conference ROI Report:\n\n💼 Team Performance:\n{teamMetrics}\n\n🎯 Strategic Outcomes:\n{outcomes}\n\nExcited about the partnerships and opportunities ahead!\n\n{hashtags}`,
        hashtags: '#Leadership #BusinessDevelopment #Innovation #ROI'
      },
      achievement: {
        template: `🏆 Conference Achievement Unlocked!\n\n🎯 {achievement}\n\n📈 This represents {impact} for our continued growth and innovation.\n\nGrateful for the incredible learning opportunities and connections made.\n\n{hashtags}`,
        hashtags: '#Achievement #Growth #Learning #Success'
      }
    });
    
    // Twitter templates
    this.shareTemplates.set('twitter', {
      personal: {
        template: `🎯 Conference wrap-up:\n\n{highlights}\n\nIncredible learning experience! 🚀\n\n{hashtags}`,
        hashtags: '#ConferenceLife #Networking #TechConf #Learning',
        maxLength: 280
      },
      quick: {
        template: `{metric} {context} at today's conference! 🎯\n\nNetworking level: Expert 📈\n\n{hashtags}`,
        hashtags: '#Conference #Networking #Growth',
        maxLength: 280
      },
      insight: {
        template: `💡 Key insight from today: {insight}\n\nGame-changing perspective for {industry}! 🚀\n\n{hashtags}`,
        hashtags: '#Innovation #Insights #TechTrends',
        maxLength: 280
      }
    });
    
    // Facebook templates
    this.shareTemplates.set('facebook', {
      personal: {
        template: `What an incredible conference experience! 🎯\n\nI had the opportunity to:\n{achievements}\n\nThe connections I've made and insights I've gained will definitely shape my professional journey ahead. Excited to put these learnings into practice!\n\n{hashtags}`,
        hashtags: '#ConferenceExperience #ProfessionalGrowth #Networking #Innovation'
      },
      story: {
        template: `Conference Story: From {startState} to {endState} 📈\n\nWhat started as {initialGoal} turned into an incredible journey of discovery.\n\nKey moments:\n{keyMoments}\n\nGrateful for every connection made and lesson learned! 🙏\n\n{hashtags}`,
        hashtags: '#Journey #Growth #Conference #Success'
      }
    });
    
    // Email templates
    this.shareTemplates.set('email', {
      report: {
        subject: 'Conference Insights Report - {conferenceName}',
        template: `Hi there,\n\nI wanted to share some insights from my recent conference experience at {conferenceName}.\n\n{summary}\n\nHere are the key highlights:\n{highlights}\n\nI'd love to discuss how these insights might benefit our upcoming projects. Let me know if you'd like to chat!\n\nBest regards,\n{name}`,
        type: 'text'
      },
      invitation: {
        subject: 'Let\'s Connect - Met at {conferenceName}',
        template: `Hi {recipientName},\n\nIt was great meeting you at {conferenceName}! I really enjoyed our conversation about {conversationTopic}.\n\nI thought you might find this conference summary interesting:\n{insights}\n\nI'd love to continue our discussion and explore potential collaboration opportunities.\n\nLooking forward to staying in touch!\n\nBest,\n{senderName}`,
        type: 'text'
      }
    });
  }
  
  /**
   * Set report data for sharing
   */
  setReportData(reportData) {
    this.reportData = reportData;
    this.generateShareableContent();
  }
  
  /**
   * Generate shareable content from report data
   */
  generateShareableContent() {
    if (!this.reportData) return;
    
    // Generate content for each platform
    this.options.platforms.forEach(platform => {
      const content = this.createPlatformContent(platform);
      this.shareableContent.set(platform, content);
    });
    
    // Update UI
    this.updateShareOptions();
  }
  
  /**
   * Create platform-specific content
   */
  createPlatformContent(platform) {
    const templates = this.shareTemplates.get(platform) || {};
    const content = [];
    
    Object.keys(templates).forEach(templateType => {
      const template = templates[templateType];
      const generatedContent = this.fillTemplate(template, platform, templateType);
      
      content.push({
        type: templateType,
        title: this.getContentTitle(platform, templateType),
        content: generatedContent.content,
        hashtags: generatedContent.hashtags,
        subject: generatedContent.subject,
        preview: this.generatePreview(generatedContent.content, platform),
        length: generatedContent.content.length,
        isValid: this.validateContent(generatedContent.content, platform)
      });
    });
    
    return content;
  }
  
  /**
   * Fill template with report data
   */
  fillTemplate(template, platform, templateType) {
    let content = template.template || template;
    let hashtags = template.hashtags || '';
    let subject = template.subject || '';
    
    // Replace placeholders with actual data
    const replacements = this.getReplacements();
    
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, replacements[key]);
      subject = subject.replace(regex, replacements[key]);
      hashtags = hashtags.replace(regex, replacements[key]);
    });
    
    // Handle platform-specific constraints
    if (template.maxLength && content.length > template.maxLength) {
      content = this.truncateContent(content, template.maxLength);
    }
    
    return { content, hashtags, subject };
  }
  
  /**
   * Get replacement values from report data
   */
  getReplacements() {
    if (!this.reportData) return {};
    
    const insights = this.reportData.personalInsights || {};
    const metadata = this.reportData.metadata || {};
    
    return {
      conferenceName: metadata.conferenceName || 'Professional Conference',
      name: metadata.userName || 'Professional',
      totalConnections: insights.networking?.totalConnections || 0,
      eventsAttended: insights.engagement?.eventsAttended || 0,
      learningHours: Math.round((insights.learning?.totalLearningTime || 0) / 60),
      opportunities: insights.opportunities?.interestedOpportunities || 0,
      highlights: this.generateHighlights(),
      achievements: this.generateAchievements(),
      teamMetrics: this.generateTeamMetrics(),
      outcomes: this.generateOutcomes(),
      achievement: this.getTopAchievement(),
      impact: this.getImpactStatement(),
      metric: this.getTopMetric(),
      context: this.getMetricContext(),
      insight: this.getKeyInsight(),
      industry: metadata.industry || 'technology',
      startState: 'curious attendee',
      endState: 'empowered professional',
      initialGoal: 'learning and networking',
      keyMoments: this.generateKeyMoments(),
      summary: this.generateExecutiveSummary(),
      conversationTopic: 'innovation trends',
      senderName: metadata.userName || 'Professional',
      recipientName: '[Contact Name]'
    };
  }
  
  /**
   * Generate highlights list
   */
  generateHighlights() {
    const highlights = [];
    const insights = this.reportData.personalInsights || {};
    
    if (insights.networking?.totalConnections) {
      highlights.push(`• ${insights.networking.totalConnections} new professional connections`);
    }
    
    if (insights.engagement?.eventsAttended) {
      highlights.push(`• ${insights.engagement.eventsAttended} sessions attended`);
    }
    
    if (insights.learning?.totalLearningTime) {
      highlights.push(`• ${Math.round(insights.learning.totalLearningTime / 60)} hours of learning`);
    }
    
    if (insights.opportunities?.interestedOpportunities) {
      highlights.push(`• ${insights.opportunities.interestedOpportunities} promising opportunities identified`);
    }
    
    return highlights.join('\n');
  }
  
  /**
   * Generate achievements list
   */
  generateAchievements() {
    const achievements = [
      'Connect with industry leaders and innovators',
      'Gain insights into cutting-edge technologies',
      'Identify new business opportunities',
      'Expand my professional network significantly'
    ];
    
    return achievements.map(a => `• ${a}`).join('\n');
  }
  
  /**
   * Generate team metrics
   */
  generateTeamMetrics() {
    return [
      '• 15+ new strategic partnerships identified',
      '• 300% increase in qualified leads',
      '• 12 key technology insights captured',
      '• 95% positive feedback on presentations'
    ].join('\n');
  }
  
  /**
   * Generate outcomes
   */
  generateOutcomes() {
    return [
      '• New market opportunities worth $2M+ identified',
      '• Strategic technology partnerships established',
      '• Talent pipeline significantly expanded',
      '• Brand visibility increased by 40%'
    ].join('\n');
  }
  
  /**
   * Get top achievement
   */
  getTopAchievement() {
    const insights = this.reportData.personalInsights || {};
    const connections = insights.networking?.totalConnections || 0;
    
    if (connections >= 10) {
      return `Connected with ${connections} industry professionals in 3 days`;
    } else if (insights.learning?.totalLearningTime >= 300) {
      return `Completed 5+ hours of intensive learning sessions`;
    } else {
      return 'Successfully expanded professional network and knowledge base';
    }
  }
  
  /**
   * Get impact statement
   */
  getImpactStatement() {
    return 'significant value in strategic planning and business development';
  }
  
  /**
   * Get top metric
   */
  getTopMetric() {
    const insights = this.reportData.personalInsights || {};
    const connections = insights.networking?.totalConnections || 0;
    return `${connections} meaningful connections`;
  }
  
  /**
   * Get metric context
   */
  getMetricContext() {
    return 'with industry leaders and innovators';
  }
  
  /**
   * Get key insight
   */
  getKeyInsight() {
    const insights = [
      'AI integration is reshaping industry standards',
      'Sustainable technology is the next major disruption',
      'Remote collaboration tools are evolving rapidly',
      'Cross-industry partnerships drive innovation'
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }
  
  /**
   * Generate key moments
   */
  generateKeyMoments() {
    return [
      '• Breakthrough conversation with industry pioneer',
      '• Discovering game-changing technology solution',
      '• Connecting with perfect strategic partner',
      '• Gaining clarity on market opportunities'
    ].join('\n');
  }
  
  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const insights = this.reportData.personalInsights || {};
    const connections = insights.networking?.totalConnections || 0;
    const events = insights.engagement?.eventsAttended || 0;
    
    return `Attended ${events} sessions and connected with ${connections} professionals, resulting in significant insights for strategic planning and business development.`;
  }
  
  /**
   * Truncate content to fit platform limits
   */
  truncateContent(content, maxLength) {
    if (content.length <= maxLength) return content;
    
    const truncated = content.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  /**
   * Generate preview text
   */
  generatePreview(content, platform) {
    const maxPreviewLength = 100;
    return content.length > maxPreviewLength ? 
      content.substring(0, maxPreviewLength) + '...' : content;
  }
  
  /**
   * Validate content for platform
   */
  validateContent(content, platform) {
    const limits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      email: 10000
    };
    
    const limit = limits[platform];
    return !limit || content.length <= limit;
  }
  
  /**
   * Get content title
   */
  getContentTitle(platform, type) {
    const titles = {
      linkedin: {
        personal: 'Personal Achievement Post',
        executive: 'Executive Summary Post',
        achievement: 'Achievement Highlight'
      },
      twitter: {
        personal: 'Personal Update Tweet',
        quick: 'Quick Metric Tweet',
        insight: 'Key Insight Tweet'
      },
      facebook: {
        personal: 'Personal Story Post',
        story: 'Conference Journey Story'
      },
      email: {
        report: 'Insights Report Email',
        invitation: 'Connection Invitation'
      }
    };
    
    return titles[platform]?.[type] || `${platform} ${type}`;
  }
  
  /**
   * Render the share interface
   */
  render() {
    this.container.innerHTML = this.getShareHTML();
    this.attachEventListeners();
  }
  
  /**
   * Generate share interface HTML
   */
  getShareHTML() {
    return `
      <div class="social-share" data-theme="${this.options.theme}">
        <div class="share-header">
          <h2 class="share-title">Share Your Conference Insights</h2>
          <p class="share-subtitle">Choose a platform and customize your message</p>
        </div>
        
        <div class="platform-selector">
          ${this.getPlatformButtonsHTML()}
        </div>
        
        <div class="share-content">
          <div class="content-templates" id="contentTemplates">
            ${this.getTemplatesHTML()}
          </div>
          
          <div class="preview-section">
            <h3 class="preview-title">Preview</h3>
            <div class="content-preview" id="contentPreview">
              <div class="preview-placeholder">Select a template to see preview</div>
            </div>
          </div>
          
          <div class="share-actions">
            <button class="share-btn primary" id="shareBtn" disabled>
              Share Now
            </button>
            <button class="share-btn" id="copyBtn" disabled>
              Copy Content
            </button>
            <button class="share-btn" id="downloadBtn">
              Download Images
            </button>
          </div>
        </div>
        
        <div class="share-analytics" id="shareAnalytics">
          <h3 class="analytics-title">Share Performance</h3>
          <div class="analytics-grid">
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Total Shares</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Engagements</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Clicks</div>
            </div>
          </div>
        </div>
      </div>
      
      ${this.getStylesHTML()}
    `;
  }
  
  /**
   * Get platform buttons HTML
   */
  getPlatformButtonsHTML() {
    const platformIcons = {
      linkedin: '💼',
      twitter: '🐦',
      facebook: '📘',
      email: '📧'
    };
    
    return this.options.platforms.map(platform => `
      <button class="platform-btn" data-platform="${platform}">
        <span class="platform-icon">${platformIcons[platform] || '📱'}</span>
        <span class="platform-name">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
      </button>
    `).join('');
  }
  
  /**
   * Get templates HTML
   */
  getTemplatesHTML() {
    return `
      <div class="templates-placeholder">
        <div class="placeholder-icon">📝</div>
        <div class="placeholder-text">Select a platform to see available templates</div>
      </div>
    `;
  }
  
  /**
   * Update share options
   */
  updateShareOptions() {
    const templatesContainer = document.getElementById('contentTemplates');
    if (!templatesContainer) return;
    
    const activePlatform = document.querySelector('.platform-btn.active')?.dataset.platform;
    if (!activePlatform) return;
    
    const platformContent = this.shareableContent.get(activePlatform) || [];
    
    templatesContainer.innerHTML = platformContent.map((content, index) => `
      <div class="content-template" data-platform="${activePlatform}" data-index="${index}">
        <div class="template-header">
          <h4 class="template-title">${content.title}</h4>
          <div class="template-meta">
            <span class="content-length ${content.isValid ? 'valid' : 'invalid'}">
              ${content.length} chars
            </span>
            ${content.isValid ? '<span class="valid-badge">✓</span>' : '<span class="invalid-badge">!</span>'}
          </div>
        </div>
        <div class="template-preview">
          ${content.preview}
        </div>
        <button class="select-template-btn" data-platform="${activePlatform}" data-index="${index}">
          Use This Template
        </button>
      </div>
    `).join('');
    
    this.attachTemplateListeners();
  }
  
  /**
   * Update content preview
   */
  updateContentPreview(platform, index) {
    const previewContainer = document.getElementById('contentPreview');
    if (!previewContainer) return;
    
    const platformContent = this.shareableContent.get(platform);
    if (!platformContent || !platformContent[index]) return;
    
    const content = platformContent[index];
    
    previewContainer.innerHTML = `
      <div class="preview-card" data-platform="${platform}">
        <div class="preview-header">
          <span class="platform-badge">${platform}</span>
          <span class="content-type">${content.type}</span>
        </div>
        <div class="preview-content">
          ${content.content.replace(/\n/g, '<br>')}
        </div>
        ${content.hashtags ? `<div class="preview-hashtags">${content.hashtags}</div>` : ''}
        <div class="preview-footer">
          <span class="char-count ${content.isValid ? 'valid' : 'invalid'}">
            ${content.length} characters
          </span>
        </div>
      </div>
      
      <div class="preview-actions">
        <button class="edit-content-btn" onclick="socialShare.editContent('${platform}', ${index})">
          Edit Content
        </button>
        <button class="add-image-btn" onclick="socialShare.addImage()">
          Add Image
        </button>
      </div>
    `;
    
    // Enable action buttons
    document.getElementById('shareBtn').disabled = false;
    document.getElementById('copyBtn').disabled = false;
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Platform selection
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.platform-btn').classList.add('active');
        this.updateShareOptions();
      });
    });
    
    // Share button
    document.getElementById('shareBtn')?.addEventListener('click', () => {
      this.shareContent();
    });
    
    // Copy button
    document.getElementById('copyBtn')?.addEventListener('click', () => {
      this.copyContent();
    });
    
    // Download button
    document.getElementById('downloadBtn')?.addEventListener('click', () => {
      this.downloadImages();
    });
    
    // Make instance globally accessible
    window.socialShare = this;
  }
  
  /**
   * Attach template listeners
   */
  attachTemplateListeners() {
    document.querySelectorAll('.select-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = e.target.dataset.platform;
        const index = parseInt(e.target.dataset.index);
        
        // Update active template
        document.querySelectorAll('.content-template').forEach(t => t.classList.remove('active'));
        e.target.closest('.content-template').classList.add('active');
        
        this.updateContentPreview(platform, index);
      });
    });
  }
  
  /**
   * Share content to selected platform
   */
  async shareContent() {
    const activeTemplate = document.querySelector('.content-template.active');
    if (!activeTemplate) {
      alert('Please select a template first');
      return;
    }
    
    const platform = activeTemplate.dataset.platform;
    const index = parseInt(activeTemplate.dataset.index);
    const content = this.shareableContent.get(platform)[index];
    
    try {
      await this.shareToplatform(platform, content);
      this.trackShare(platform, content.type);
    } catch (error) {
      console.error('[SocialShare] Share failed:', error);
      alert('Share failed. Please try copying the content instead.');
    }
  }
  
  /**
   * Share to specific platform
   */
  async shareToplatform(platform, content) {
    const shareUrl = this.buildShareURL(platform, content);
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    } else if (navigator.share && platform === 'native') {
      await navigator.share({
        title: 'Conference Insights',
        text: content.content,
        url: window.location.href
      });
    } else {
      throw new Error(`Sharing not supported for ${platform}`);
    }
  }
  
  /**
   * Build share URL for platform
   */
  buildShareURL(platform, content) {
    const baseURLs = {
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
      twitter: 'https://twitter.com/intent/tweet',
      facebook: 'https://www.facebook.com/sharer/sharer.php',
      email: 'mailto:'
    };
    
    const baseURL = baseURLs[platform];
    if (!baseURL) return null;
    
    const params = new URLSearchParams();
    
    switch (platform) {
      case 'linkedin':
        params.append('url', window.location.href);
        params.append('summary', content.content);
        break;
        
      case 'twitter':
        params.append('text', content.content + (content.hashtags ? ' ' + content.hashtags : ''));
        params.append('url', window.location.href);
        break;
        
      case 'facebook':
        params.append('u', window.location.href);
        params.append('quote', content.content);
        break;
        
      case 'email':
        params.append('subject', content.subject || 'Conference Insights');
        params.append('body', content.content + '\n\nShared from: ' + window.location.href);
        break;
    }
    
    return baseURL + '?' + params.toString();
  }
  
  /**
   * Copy content to clipboard
   */
  async copyContent() {
    const activeTemplate = document.querySelector('.content-template.active');
    if (!activeTemplate) {
      alert('Please select a template first');
      return;
    }
    
    const platform = activeTemplate.dataset.platform;
    const index = parseInt(activeTemplate.dataset.index);
    const content = this.shareableContent.get(platform)[index];
    
    const fullContent = content.content + 
      (content.hashtags ? '\n\n' + content.hashtags : '');
    
    try {
      await navigator.clipboard.writeText(fullContent);
      
      // Visual feedback
      const copyBtn = document.getElementById('copyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('success');
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('success');
      }, 2000);
      
    } catch (error) {
      console.error('[SocialShare] Copy failed:', error);
      alert('Copy failed. Please manually select and copy the content.');
    }
  }
  
  /**
   * Download generated images
   */
  async downloadImages() {
    try {
      // Generate shareable images
      const images = await this.generateShareImages();
      
      if (images.length === 0) {
        alert('No images available for download');
        return;
      }
      
      // Download each image
      images.forEach((imageData, index) => {
        const a = document.createElement('a');
        a.href = imageData.url;
        a.download = imageData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      
    } catch (error) {
      console.error('[SocialShare] Image download failed:', error);
      alert('Image download failed. Please try again.');
    }
  }
  
  /**
   * Generate shareable images
   */
  async generateShareImages() {
    const images = [];
    
    // Create canvas for image generation
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // Standard social media image size
    const ctx = canvas.getContext('2d');
    
    // Generate summary image
    this.drawSummaryImage(ctx, canvas);
    images.push({
      url: canvas.toDataURL('image/png'),
      filename: 'conference-summary.png'
    });
    
    // Generate metrics image
    this.drawMetricsImage(ctx, canvas);
    images.push({
      url: canvas.toDataURL('image/png'),
      filename: 'conference-metrics.png'
    });
    
    return images;
  }
  
  /**
   * Draw summary image on canvas
   */
  drawSummaryImage(ctx, canvas) {
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Conference Insights', width/2, 120);
    
    // Metrics
    if (this.reportData?.personalInsights) {
      const insights = this.reportData.personalInsights;
      const y = 250;
      const spacing = 150;
      
      ctx.font = 'bold 48px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      
      // Connections
      ctx.fillText(insights.networking?.totalConnections || '0', width/4, y);
      ctx.font = '24px system-ui';
      ctx.fillText('New Connections', width/4, y + 40);
      
      // Events
      ctx.font = 'bold 48px system-ui';
      ctx.fillText(insights.engagement?.eventsAttended || '0', width/2, y);
      ctx.font = '24px system-ui';
      ctx.fillText('Events Attended', width/2, y + 40);
      
      // Learning Hours
      ctx.font = 'bold 48px system-ui';
      ctx.fillText(Math.round((insights.learning?.totalLearningTime || 0) / 60), width * 3/4, y);
      ctx.font = '24px system-ui';
      ctx.fillText('Learning Hours', width * 3/4, y + 40);
    }
    
    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '20px system-ui';
    ctx.fillText('Generated by Professional Intelligence Platform', width/2, height - 50);
  }
  
  /**
   * Draw metrics image on canvas
   */
  drawMetricsImage(ctx, canvas) {
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Performance Metrics', width/2, 80);
    
    // Draw simple charts/metrics visualization
    this.drawMetricBars(ctx, width, height);
    
    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '18px system-ui';
    ctx.fillText('Professional Conference Intelligence', width/2, height - 30);
  }
  
  /**
   * Draw metric bars
   */
  drawMetricBars(ctx, width, height) {
    if (!this.reportData?.personalInsights) return;
    
    const insights = this.reportData.personalInsights;
    const metrics = [
      { label: 'Networking', value: insights.networking?.score || 0, color: '#10b981' },
      { label: 'Engagement', value: insights.engagement?.engagementScore || 0, color: '#3b82f6' },
      { label: 'Learning', value: insights.learning?.knowledgeGainScore || 0, color: '#f59e0b' },
      { label: 'Efficiency', value: insights.efficiency?.efficiencyScore || 0, color: '#8b5cf6' }
    ];
    
    const barWidth = 60;
    const maxHeight = 200;
    const startX = (width - (metrics.length * (barWidth + 40))) / 2;
    const baseY = height - 150;
    
    metrics.forEach((metric, index) => {
      const x = startX + index * (barWidth + 40);
      const barHeight = metric.value * maxHeight;
      
      // Draw bar
      ctx.fillStyle = metric.color;
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      
      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(metric.label, x + barWidth/2, baseY + 25);
      
      // Draw value
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`${Math.round(metric.value * 100)}%`, x + barWidth/2, baseY - barHeight - 10);
    });
  }
  
  /**
   * Edit content
   */
  editContent(platform, index) {
    const content = this.shareableContent.get(platform)[index];
    const newContent = prompt('Edit your content:', content.content);
    
    if (newContent !== null && newContent !== content.content) {
      content.content = newContent;
      content.length = newContent.length;
      content.isValid = this.validateContent(newContent, platform);
      content.preview = this.generatePreview(newContent, platform);
      
      // Update UI
      this.updateContentPreview(platform, index);
    }
  }
  
  /**
   * Add image to content
   */
  addImage() {
    alert('Image upload feature coming soon!');
  }
  
  /**
   * Track share event
   */
  trackShare(platform, contentType) {
    if (!this.options.trackShares) return;
    
    console.log(`[SocialShare] Tracked share: ${platform} - ${contentType}`);
    
    // Update analytics display
    const totalShares = document.querySelector('.metric-value');
    if (totalShares) {
      const current = parseInt(totalShares.textContent) || 0;
      totalShares.textContent = current + 1;
    }
  }
  
  /**
   * Get error HTML
   */
  getErrorHTML(message) {
    return `
      <div class="share-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Failed to load social sharing: ${message}</div>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
  
  /**
   * Get styles HTML
   */
  getStylesHTML() {
    return `
      <style>
        .social-share {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .social-share[data-theme="dark"] {
          background: #0b0f14;
          color: #e1e5ea;
        }
        
        .share-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .share-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #6366f1;
        }
        
        .share-subtitle {
          font-size: 16px;
          color: #9ca3af;
          margin: 0;
        }
        
        .platform-selector {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        
        .platform-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          border: 2px solid #2a3038;
          border-radius: 12px;
          background: #1a1f26;
          color: #e1e5ea;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        
        .platform-btn:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
        }
        
        .platform-btn.active {
          border-color: #6366f1;
          background: #1e3a8a;
          color: white;
        }
        
        .platform-icon {
          font-size: 24px;
        }
        
        .platform-name {
          font-size: 14px;
          font-weight: 500;
        }
        
        .share-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        
        .content-templates {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 20px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .templates-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #9ca3af;
        }
        
        .placeholder-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .content-template {
          border: 1px solid #2a3038;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        
        .content-template:hover {
          border-color: #6366f1;
        }
        
        .content-template.active {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .template-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        
        .template-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .content-length.valid {
          color: #10b981;
        }
        
        .content-length.invalid {
          color: #ef4444;
        }
        
        .valid-badge {
          color: #10b981;
        }
        
        .invalid-badge {
          color: #ef4444;
        }
        
        .template-preview {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .select-template-btn {
          padding: 8px 16px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .select-template-btn:hover {
          background: #5855eb;
        }
        
        .preview-section {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 20px;
        }
        
        .preview-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }
        
        .content-preview {
          min-height: 200px;
        }
        
        .preview-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #9ca3af;
          text-align: center;
        }
        
        .preview-card {
          border: 1px solid #2a3038;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .preview-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .platform-badge {
          padding: 4px 8px;
          background: #6366f1;
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .content-type {
          padding: 4px 8px;
          background: #374151;
          color: #e1e5ea;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .preview-content {
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }
        
        .preview-hashtags {
          font-size: 12px;
          color: #3b82f6;
          margin-bottom: 12px;
        }
        
        .preview-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        
        .char-count.valid {
          color: #10b981;
        }
        
        .char-count.invalid {
          color: #ef4444;
        }
        
        .preview-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .edit-content-btn,
        .add-image-btn {
          padding: 6px 12px;
          background: #374151;
          color: #e1e5ea;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .edit-content-btn:hover,
        .add-image-btn:hover {
          background: #4b5563;
        }
        
        .share-actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        
        .share-btn {
          padding: 12px 24px;
          border: 1px solid #2a3038;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: #1a1f26;
          color: #e1e5ea;
        }
        
        .share-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .share-btn:not(:disabled):hover {
          transform: translateY(-1px);
        }
        
        .share-btn.primary {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
        
        .share-btn.primary:hover {
          background: #5855eb;
        }
        
        .share-btn.success {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        
        .share-analytics {
          background: #1a1f26;
          border: 1px solid #2a3038;
          border-radius: 12px;
          padding: 24px;
        }
        
        .analytics-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #6366f1;
        }
        
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }
        
        .metric-card {
          background: #0f1419;
          border: 1px solid #2a3038;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 4px;
        }
        
        .metric-label {
          font-size: 12px;
          color: #9ca3af;
        }
        
        .share-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 16px;
          margin-bottom: 24px;
        }
        
        .retry-btn {
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .share-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .platform-selector {
            justify-content: center;
            gap: 12px;
          }
          
          .platform-btn {
            min-width: 80px;
            padding: 12px 16px;
          }
          
          .share-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      </style>
    `;
  }
  
  /**
   * Clean up
   */
  destroy() {
    this.shareableContent.clear();
    this.generatedImages.clear();
    this.shareTemplates.clear();
    
    if (window.socialShare === this) {
      delete window.socialShare;
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialShare;
}

// Global access
window.SocialShare = SocialShare;