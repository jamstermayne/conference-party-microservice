/**
 * Viral Share Engine
 * Advanced social sharing with viral growth optimization
 */

class ViralShareEngine {
  constructor() {
    this.platforms = ['linkedin', 'twitter', 'facebook', 'email', 'slack', 'teams'];
    this.viralThreshold = 0.5; // Viral coefficient threshold
    this.conversionThreshold = 0.2; // Enterprise conversion threshold
    this.shareCache = new Map();
    this.analyticsQueue = [];
  }

  /**
   * Generate optimized share content for each platform
   */
  async generateShareContent(report, platform) {
    const executiveSummary = report.executiveSummary;
    const baseUrl = `${window.location.origin}/reports/${report.metadata.reportId || 'demo'}`;
    
    // Check cache first
    const cacheKey = `${report.metadata.reportId}-${platform}`;
    if (this.shareCache.has(cacheKey)) {
      return this.shareCache.get(cacheKey);
    }
    
    let content;
    
    switch (platform) {
      case 'linkedin':
        content = await this.generateLinkedInContent(report, executiveSummary, baseUrl);
        break;
        
      case 'twitter':
        content = await this.generateTwitterContent(report, executiveSummary, baseUrl);
        break;
        
      case 'facebook':
        content = await this.generateFacebookContent(report, executiveSummary, baseUrl);
        break;
        
      case 'email':
        content = await this.generateEmailContent(report, executiveSummary, baseUrl);
        break;
        
      case 'slack':
        content = await this.generateSlackContent(report, executiveSummary, baseUrl);
        break;
        
      case 'teams':
        content = await this.generateTeamsContent(report, executiveSummary, baseUrl);
        break;
        
      default:
        content = await this.generateGenericShareContent(report, baseUrl);
    }
    
    // Cache the content
    this.shareCache.set(cacheKey, content);
    
    return content;
  }

  async generateLinkedInContent(report, summary, baseUrl) {
    const roiMultiple = this.calculateROIMultiple(report);
    const imageUrl = await this.generateSocialImage(report, 'linkedin');
    
    return {
      title: summary.headline,
      summary: `Just completed ${report.metadata.conferenceName} with impressive results:\n\n` +
              `💰 ${summary.keyMetrics.pipelineGenerated} in pipeline generated\n` +
              `🎯 ${summary.keyMetrics.qualifiedLeads} qualified leads\n` +
              `🤝 ${summary.keyMetrics.newConnections} high-value connections\n` +
              `⏱️ ${summary.keyMetrics.timeEfficiency} time efficiency\n\n` +
              `Conference ROI: ${roiMultiple}x investment\n\n` +
              `Key insights:\n` +
              this.formatKeyInsights(summary.keyTakeaways) + `\n\n` +
              `View the full executive report to see how strategic conference attendance drives measurable business value.\n\n` +
              `#ConferenceROI #B2BNetworking #TechLeadership #BusinessDevelopment #SalesStrategy`,
      url: `${baseUrl}?utm_source=linkedin&utm_medium=social&utm_campaign=report_share&utm_content=executive_summary`,
      imageUrl: imageUrl,
      callToAction: 'View Full Report'
    };
  }

  async generateTwitterContent(report, summary, baseUrl) {
    const roiMultiple = this.calculateROIMultiple(report);
    const shortUrl = await this.generateShortUrl(baseUrl, 'twitter');
    
    return {
      text: `${report.metadata.conferenceName} delivered ${roiMultiple}x ROI! 🚀\n\n` +
            `📊 ${summary.keyMetrics.pipelineGenerated} pipeline\n` +
            `🎯 ${summary.keyMetrics.qualifiedLeads} qualified leads\n` +
            `🤝 ${summary.keyMetrics.newConnections} connections\n` +
            `⏱️ ${summary.keyMetrics.timeEfficiency} efficiency\n\n` +
            `Full report: ${shortUrl}`,
      hashtags: ['ConferenceROI', 'B2BNetworking', 'TechConferences', report.metadata.conferenceName.replace(/\s+/g, '')],
      imageUrl: await this.generateSocialImage(report, 'twitter')
    };
  }

  async generateFacebookContent(report, summary, baseUrl) {
    return {
      message: `🎯 Conference Success Story: ${report.metadata.conferenceName}\n\n` +
               `I'm excited to share the results from my recent conference attendance. ` +
               `The ROI has been incredible - ${this.calculateROIMultiple(report)}x return on investment!\n\n` +
               `Highlights:\n` +
               `• Generated ${summary.keyMetrics.pipelineGenerated} in qualified pipeline\n` +
               `• Connected with ${summary.keyMetrics.newConnections} industry leaders\n` +
               `• Identified ${summary.keyMetrics.qualifiedLeads} business opportunities\n\n` +
               `Strategic conference attendance isn't just about networking - it's about driving real business results.\n\n` +
               `Check out my full executive report for insights on maximizing conference ROI.`,
      link: `${baseUrl}?utm_source=facebook&utm_medium=social`,
      imageUrl: await this.generateSocialImage(report, 'facebook')
    };
  }

  async generateEmailContent(report, summary, baseUrl) {
    const emailBody = this.generateEmailBody(report);
    const attachmentUrl = await this.generateReportPDF(report);
    
    return {
      subject: `Conference ROI Report: ${summary.headline}`,
      body: emailBody,
      attachmentUrl: attachmentUrl,
      ctaUrl: `${baseUrl}?utm_source=email&utm_medium=direct&utm_campaign=report_share`,
      preheader: `${summary.keyMetrics.pipelineGenerated} pipeline generated with ${this.calculateROIMultiple(report)}x ROI`
    };
  }

  async generateSlackContent(report, summary, baseUrl) {
    const roiMultiple = this.calculateROIMultiple(report);
    
    return {
      text: `📊 *Conference ROI Report - ${report.metadata.conferenceName}*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: summary.headline
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Pipeline Generated:*\n${summary.keyMetrics.pipelineGenerated}`
            },
            {
              type: 'mrkdwn',
              text: `*Qualified Leads:*\n${summary.keyMetrics.qualifiedLeads}`
            },
            {
              type: 'mrkdwn',
              text: `*New Connections:*\n${summary.keyMetrics.newConnections}`
            },
            {
              type: 'mrkdwn',
              text: `*ROI Multiple:*\n${roiMultiple}x`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Key Takeaways:*\n${this.formatKeyInsights(summary.keyTakeaways, '• ')}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View Full Report'
              },
              url: `${baseUrl}?utm_source=slack&utm_medium=social`,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📄 Download PDF'
              },
              url: await this.generateReportPDF(report)
            }
          ]
        }
      ]
    };
  }

  async generateTeamsContent(report, summary, baseUrl) {
    const roiMultiple = this.calculateROIMultiple(report);
    
    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: summary.headline,
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: `**${report.metadata.conferenceName} ROI Report**`,
          activitySubtitle: report.metadata.dates,
          activityImage: await this.generateSocialImage(report, 'teams'),
          facts: [
            {
              name: 'Pipeline Generated',
              value: summary.keyMetrics.pipelineGenerated
            },
            {
              name: 'Qualified Leads',
              value: summary.keyMetrics.qualifiedLeads
            },
            {
              name: 'New Connections',
              value: summary.keyMetrics.newConnections
            },
            {
              name: 'ROI Multiple',
              value: `${roiMultiple}x`
            }
          ],
          text: this.formatKeyInsights(summary.keyTakeaways)
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Full Report',
          targets: [
            {
              os: 'default',
              uri: `${baseUrl}?utm_source=teams&utm_medium=social`
            }
          ]
        }
      ]
    };
  }

  async generateGenericShareContent(report, baseUrl) {
    return {
      title: report.executiveSummary.headline,
      description: `Conference ROI Report showing ${this.calculateROIMultiple(report)}x return on investment`,
      url: baseUrl,
      metrics: report.executiveSummary.keyMetrics
    };
  }

  /**
   * Generate dynamic social media images
   */
  async generateSocialImage(report, platform) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Platform-specific dimensions
    const dimensions = {
      linkedin: { width: 1200, height: 627 },
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
      teams: { width: 1200, height: 600 }
    };
    
    const { width, height } = dimensions[platform] || dimensions.linkedin;
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(0.5, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add overlay pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        if ((i + j) % 80 === 0) {
          ctx.fillRect(i, j, 20, 20);
        }
      }
    }
    
    // Add conference logo if available
    if (report.metadata.conferenceLogo) {
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = report.metadata.conferenceLogo;
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          setTimeout(reject, 5000); // 5 second timeout
        });
        
        ctx.globalAlpha = 0.9;
        ctx.drawImage(logo, 50, 50, 120, 120);
        ctx.globalAlpha = 1;
      } catch (error) {
        console.warn('Failed to load conference logo:', error);
      }
    }
    
    // Add headline text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    
    // Word wrap headline
    const headlineWords = report.executiveSummary.headline.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of headlineWords) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > width - 200 && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    
    // Draw headline
    let y = height / 2 - (lines.length * 35);
    lines.forEach(line => {
      ctx.fillText(line, width / 2, y);
      y += 70;
    });
    
    // Add metrics section
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.shadowBlur = 5;
    
    const metrics = [
      `💰 ${report.executiveSummary.keyMetrics.pipelineGenerated} Pipeline`,
      `🎯 ${report.executiveSummary.keyMetrics.qualifiedLeads} Qualified Leads`,
      `🤝 ${report.executiveSummary.keyMetrics.newConnections} Connections`
    ];
    
    y += 40;
    metrics.forEach(metric => {
      ctx.fillText(metric, width / 2, y);
      y += 50;
    });
    
    // Add ROI badge
    const roiMultiple = this.calculateROIMultiple(report);
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText(`${roiMultiple}x ROI`, width - 150, height - 50);
    
    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Track viral metrics and optimize sharing
   */
  async trackShareEvent(reportId, platform, userId = null) {
    const shareEvent = {
      reportId,
      platform,
      userId: userId || this.getAnonymousUserId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      sessionId: this.getSessionId()
    };
    
    // Add to analytics queue
    this.analyticsQueue.push(shareEvent);
    
    // Save to local storage for persistence
    this.saveShareEvent(shareEvent);
    
    // Update report metrics
    await this.updateReportMetrics(reportId, platform);
    
    // Analyze viral potential
    await this.analyzeViralPotential(reportId, shareEvent);
    
    // Flush analytics queue if needed
    if (this.analyticsQueue.length >= 10) {
      await this.flushAnalyticsQueue();
    }
    
    return shareEvent;
  }

  /**
   * Analyze viral growth potential
   */
  async analyzeViralPotential(reportId, shareEvent) {
    // Get historical data
    const shares = await this.getReportShares(reportId);
    const signups = await this.getSignupsFromShares(reportId);
    const conversions = await this.getEnterpriseConversions(reportId);
    
    // Calculate viral metrics
    const viralCoefficient = this.calculateViralCoefficient(shares, signups);
    const conversionRate = this.calculateConversionRate(signups, conversions);
    const engagementRate = this.calculateEngagementRate(shares);
    
    // Store viral metrics
    const viralMetrics = {
      reportId,
      timestamp: new Date().toISOString(),
      viralCoefficient,
      conversionRate,
      engagementRate,
      totalShares: shares.length,
      totalSignups: signups.length,
      totalConversions: conversions.length,
      platformBreakdown: this.getPlatformBreakdown(shares)
    };
    
    this.saveViralMetrics(viralMetrics);
    
    // Trigger actions based on performance
    if (viralCoefficient > this.viralThreshold) {
      await this.boostReportVisibility(reportId, viralMetrics);
    }
    
    if (conversionRate > this.conversionThreshold) {
      await this.triggerEnterpriseOutreach(reportId, conversions, viralMetrics);
    }
    
    // Optimize share content based on performance
    if (engagementRate < 0.1) {
      await this.optimizeShareContent(reportId, shareEvent.platform);
    }
    
    return viralMetrics;
  }

  /**
   * Calculate viral coefficient (K-factor)
   */
  calculateViralCoefficient(shares, signups) {
    if (shares.length === 0) return 0;
    
    // K = i * c
    // i = number of invites sent per user
    // c = conversion rate of invites
    const invitesPerUser = shares.length / (signups.length || 1);
    const conversionRate = signups.length / shares.length;
    
    return Number((invitesPerUser * conversionRate).toFixed(2));
  }

  /**
   * Calculate conversion rate to enterprise
   */
  calculateConversionRate(signups, conversions) {
    if (signups.length === 0) return 0;
    return Number((conversions.length / signups.length).toFixed(2));
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(shares) {
    // Group shares by user
    const userShares = {};
    shares.forEach(share => {
      const userId = share.userId || 'anonymous';
      userShares[userId] = (userShares[userId] || 0) + 1;
    });
    
    // Calculate average shares per user
    const totalUsers = Object.keys(userShares).length;
    const avgSharesPerUser = shares.length / (totalUsers || 1);
    
    // Engagement rate based on repeat sharing
    const repeatUsers = Object.values(userShares).filter(count => count > 1).length;
    const engagementRate = repeatUsers / (totalUsers || 1);
    
    return Number(engagementRate.toFixed(2));
  }

  /**
   * Get platform breakdown
   */
  getPlatformBreakdown(shares) {
    const breakdown = {};
    
    shares.forEach(share => {
      breakdown[share.platform] = (breakdown[share.platform] || 0) + 1;
    });
    
    // Calculate percentages
    const total = shares.length;
    Object.keys(breakdown).forEach(platform => {
      breakdown[platform] = {
        count: breakdown[platform],
        percentage: Number(((breakdown[platform] / total) * 100).toFixed(1))
      };
    });
    
    return breakdown;
  }

  /**
   * Boost report visibility for viral content
   */
  async boostReportVisibility(reportId, metrics) {
    console.log(`Boosting visibility for viral report ${reportId}`, metrics);
    
    // Update report status
    const boostData = {
      reportId,
      boostedAt: new Date().toISOString(),
      viralCoefficient: metrics.viralCoefficient,
      reason: 'viral_threshold_exceeded',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    // Save boost data
    this.saveBoostData(boostData);
    
    // Trigger notifications
    this.notifyViralSuccess(reportId, metrics);
    
    return boostData;
  }

  /**
   * Trigger enterprise outreach for high-converting reports
   */
  async triggerEnterpriseOutreach(reportId, conversions, metrics) {
    console.log(`Triggering enterprise outreach for report ${reportId}`, metrics);
    
    const outreachData = {
      reportId,
      triggeredAt: new Date().toISOString(),
      conversionRate: metrics.conversionRate,
      conversions: conversions,
      priority: this.calculateOutreachPriority(metrics)
    };
    
    // Save outreach data
    this.saveOutreachData(outreachData);
    
    // Notify sales team
    this.notifySalesTeam(outreachData);
    
    return outreachData;
  }

  /**
   * Optimize underperforming share content
   */
  async optimizeShareContent(reportId, platform) {
    console.log(`Optimizing share content for ${reportId} on ${platform}`);
    
    // Get performance data
    const shares = await this.getReportShares(reportId);
    const platformShares = shares.filter(s => s.platform === platform);
    
    // Analyze what's not working
    const analysis = {
      reportId,
      platform,
      currentPerformance: platformShares.length,
      recommendations: []
    };
    
    // Generate recommendations
    if (platformShares.length < 5) {
      analysis.recommendations.push('Add more compelling headline');
      analysis.recommendations.push('Include specific ROI numbers');
      analysis.recommendations.push('Add social proof elements');
    }
    
    // Clear cache to force regeneration
    const cacheKey = `${reportId}-${platform}`;
    this.shareCache.delete(cacheKey);
    
    return analysis;
  }

  /**
   * Helper methods
   */
  
  calculateROIMultiple(report) {
    const investment = report.investment || 15000;
    const returns = this.parseAmount(report.executiveSummary.keyMetrics.pipelineGenerated);
    return Number((returns / investment).toFixed(1));
  }

  parseAmount(amountStr) {
    if (typeof amountStr === 'number') return amountStr;
    
    const cleaned = amountStr.replace(/[^0-9.KMB]/g, '');
    let multiplier = 1;
    
    if (cleaned.includes('K')) multiplier = 1000;
    if (cleaned.includes('M')) multiplier = 1000000;
    if (cleaned.includes('B')) multiplier = 1000000000;
    
    return parseFloat(cleaned) * multiplier;
  }

  formatKeyInsights(takeaways, prefix = '') {
    if (!takeaways || takeaways.length === 0) {
      return `${prefix}Strategic insights gained from industry leaders`;
    }
    return takeaways.slice(0, 3).map(t => `${prefix}${t}`).join('\n');
  }

  generateEmailBody(report) {
    const summary = report.executiveSummary;
    
    return `
Dear Team,

I wanted to share the ROI report from my recent attendance at ${report.metadata.conferenceName}.

Executive Summary:
${summary.headline}

Key Metrics:
• Pipeline Generated: ${summary.keyMetrics.pipelineGenerated}
• Qualified Leads: ${summary.keyMetrics.qualifiedLeads}
• New Connections: ${summary.keyMetrics.newConnections}
• Time Efficiency: ${summary.keyMetrics.timeEfficiency}

Business Value - Immediate:
${summary.businessValue.immediateValue.map(v => `• ${v}`).join('\n')}

Business Value - Future:
${summary.businessValue.futureValue.map(v => `• ${v}`).join('\n')}

Next Steps:
${summary.nextSteps.map(s => `• ${s.title}: ${s.description}`).join('\n')}

The conference delivered a ${this.calculateROIMultiple(report)}x return on investment, validating our strategic approach to industry events.

You can view the full interactive report with detailed analytics and recommendations at the link below.

Best regards,
${report.metadata.attendeeName}
    `;
  }

  async generateReportPDF(report) {
    // In production, generate actual PDF
    // For now, return a data URL with text content
    const content = this.generatePDFContent(report);
    const blob = new Blob([content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  }

  generatePDFContent(report) {
    return `
CONFERENCE ROI REPORT
=====================

${report.metadata.conferenceName}
${report.metadata.dates}
${report.metadata.attendeeName}

EXECUTIVE SUMMARY
-----------------
${report.executiveSummary.headline}

KEY METRICS
-----------
Pipeline Generated: ${report.executiveSummary.keyMetrics.pipelineGenerated}
Qualified Leads: ${report.executiveSummary.keyMetrics.qualifiedLeads}
New Connections: ${report.executiveSummary.keyMetrics.newConnections}
Time Efficiency: ${report.executiveSummary.keyMetrics.timeEfficiency}

ROI ANALYSIS
------------
Investment: $${report.investment || 15000}
Returns: ${report.executiveSummary.keyMetrics.pipelineGenerated}
ROI Multiple: ${this.calculateROIMultiple(report)}x

Generated on: ${new Date().toLocaleDateString()}
    `;
  }

  async generateShortUrl(longUrl, platform) {
    // In production, use URL shortening service
    const shortId = Math.random().toString(36).substring(2, 8);
    return `https://conf.ly/${shortId}`;
  }

  /**
   * Data persistence methods
   */
  
  saveShareEvent(event) {
    const shares = JSON.parse(localStorage.getItem('shareEvents') || '[]');
    shares.push(event);
    localStorage.setItem('shareEvents', JSON.stringify(shares));
  }

  async getReportShares(reportId) {
    const shares = JSON.parse(localStorage.getItem('shareEvents') || '[]');
    return shares.filter(s => s.reportId === reportId);
  }

  async getSignupsFromShares(reportId) {
    // Mock data for demo
    const shares = await this.getReportShares(reportId);
    const signupRate = 0.15; // 15% of shares lead to signups
    const signupCount = Math.floor(shares.length * signupRate);
    
    return Array(signupCount).fill(null).map((_, i) => ({
      id: `signup_${i}`,
      reportId,
      source: 'share',
      timestamp: new Date().toISOString()
    }));
  }

  async getEnterpriseConversions(reportId) {
    // Mock data for demo
    const signups = await this.getSignupsFromShares(reportId);
    const conversionRate = 0.25; // 25% of signups convert to enterprise
    const conversionCount = Math.floor(signups.length * conversionRate);
    
    return Array(conversionCount).fill(null).map((_, i) => ({
      id: `conversion_${i}`,
      reportId,
      type: 'enterprise',
      value: Math.floor(Math.random() * 100000) + 50000,
      timestamp: new Date().toISOString()
    }));
  }

  saveViralMetrics(metrics) {
    const allMetrics = JSON.parse(localStorage.getItem('viralMetrics') || '[]');
    allMetrics.push(metrics);
    localStorage.setItem('viralMetrics', JSON.stringify(allMetrics));
  }

  saveBoostData(data) {
    const boosts = JSON.parse(localStorage.getItem('reportBoosts') || '[]');
    boosts.push(data);
    localStorage.setItem('reportBoosts', JSON.stringify(boosts));
  }

  saveOutreachData(data) {
    const outreach = JSON.parse(localStorage.getItem('enterpriseOutreach') || '[]');
    outreach.push(data);
    localStorage.setItem('enterpriseOutreach', JSON.stringify(outreach));
  }

  async updateReportMetrics(reportId, platform) {
    const metrics = JSON.parse(localStorage.getItem('reportMetrics') || '{}');
    
    if (!metrics[reportId]) {
      metrics[reportId] = {
        views: 0,
        shares: {},
        lastUpdated: null
      };
    }
    
    metrics[reportId].shares[platform] = (metrics[reportId].shares[platform] || 0) + 1;
    metrics[reportId].lastUpdated = new Date().toISOString();
    
    localStorage.setItem('reportMetrics', JSON.stringify(metrics));
  }

  async flushAnalyticsQueue() {
    if (this.analyticsQueue.length === 0) return;
    
    // In production, send to analytics service
    console.log('Flushing analytics queue:', this.analyticsQueue);
    
    // Clear queue
    this.analyticsQueue = [];
  }

  /**
   * Utility methods
   */
  
  getAnonymousUserId() {
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      userId = 'anon_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('anonymousUserId', userId);
    }
    return userId;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  calculateOutreachPriority(metrics) {
    // Priority based on conversion rate and total conversions
    const score = (metrics.conversionRate * 100) + (metrics.totalConversions * 10);
    
    if (score > 100) return 'high';
    if (score > 50) return 'medium';
    return 'low';
  }

  notifyViralSuccess(reportId, metrics) {
    // Create notification
    const notification = {
      type: 'viral_success',
      reportId,
      message: `Your report has gone viral! ${metrics.totalShares} shares with ${metrics.viralCoefficient}x viral coefficient.`,
      timestamp: new Date().toISOString()
    };
    
    // Save notification
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Show toast if available
    if (window.showNotification) {
      window.showNotification(notification.message, 'success');
    }
  }

  notifySalesTeam(outreachData) {
    // In production, send to CRM or sales automation system
    console.log('Notifying sales team:', outreachData);
    
    // Create sales lead
    const lead = {
      reportId: outreachData.reportId,
      priority: outreachData.priority,
      conversions: outreachData.conversions,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    
    // Save lead
    const leads = JSON.parse(localStorage.getItem('salesLeads') || '[]');
    leads.push(lead);
    localStorage.setItem('salesLeads', JSON.stringify(leads));
  }
}

// Export for use
export { ViralShareEngine };