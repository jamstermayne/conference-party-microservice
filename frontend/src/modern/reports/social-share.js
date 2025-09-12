/**
 * Social Share Manager
 * Handles viral sharing functionality for conference reports
 */

class SocialShareManager {
  constructor() {
    this.shareTemplates = {
      email: {
        subject: '🎯 My {conference} Conference ROI Report - {pipeline} Generated',
        body: `Hi team,

I wanted to share my ROI report from {conference}. Here are the key highlights:

📊 Pipeline Generated: {pipeline}
🎯 Qualified Leads: {leads}
🤝 New Connections: {connections}
⏱️ Time Efficiency: {efficiency}

Key Takeaways:
{takeaways}

You can view the full interactive report here: {url}

This report includes:
- Detailed ROI analysis and projections
- Competitive intelligence insights
- Strategic recommendations for future events
- Action items and next steps

Best regards,
{attendeeName}`
      },
      
      linkedin: {
        title: '🚀 {conference} Conference ROI: {pipeline} Pipeline Generated',
        summary: `Just wrapped up {conference} with incredible results! Generated {pipeline} in pipeline value, connected with {connections} industry leaders, and identified {leads} qualified opportunities. 

Check out my comprehensive ROI report showing how strategic conference attendance drives real business value.

#ConferenceROI #B2BNetworking #BusinessDevelopment #SalesStrategy`,
        imageAlt: '{conference} ROI Report'
      },
      
      twitter: {
        text: `🎯 {conference} Results:
• {pipeline} pipeline generated
• {leads} qualified leads
• {connections} strategic connections

Strategic conference attendance = measurable ROI 📊

See my full report: {shortUrl}

#ConferenceROI #B2B #Networking`
      },
      
      teams: {
        title: '{conference} Conference ROI Report',
        text: `Team, sharing my ROI report from {conference}:

**Key Metrics:**
- Pipeline Generated: {pipeline}
- Qualified Leads: {leads}
- New Connections: {connections}
- Time Efficiency: {efficiency}

**Business Value:**
{businessValue}

**Next Steps:**
{nextSteps}

[View Full Report]({url})`
      },
      
      slack: {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 {conference} Conference ROI Report'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Pipeline Generated:*\n{pipeline}'
              },
              {
                type: 'mrkdwn',
                text: '*Qualified Leads:*\n{leads}'
              },
              {
                type: 'mrkdwn',
                text: '*New Connections:*\n{connections}'
              },
              {
                type: 'mrkdwn',
                text: '*Time Efficiency:*\n{efficiency}'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Key Takeaways:*\n{takeaways}'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Full Report'
                },
                url: '{url}',
                style: 'primary'
              }
            ]
          }
        ]
      }
    };
    
    this.viralHooks = {
      curiosity: [
        'See how I generated {pipeline} in pipeline from one conference',
        'The {conference} ROI report that changed our sales strategy',
        'How {leads} qualified leads came from strategic networking'
      ],
      social_proof: [
        'Join {views}+ professionals viewing this conference ROI analysis',
        'Why {shares}+ leaders are sharing this conference strategy',
        'The report {conversions} teams used to justify conference budgets'
      ],
      urgency: [
        'Limited spots remaining for {nextConference}',
        'Early bird pricing ends soon for upcoming events',
        'Q{quarter} conference calendar filling up fast'
      ],
      value: [
        '{roi}% ROI from strategic conference attendance',
        'Average deal size {dealSize} from conference leads',
        '{payback} month payback period on conference investment'
      ]
    };
  }

  async generateShareContent(report, platform) {
    const data = this.extractReportData(report);
    const template = this.shareTemplates[platform];
    
    if (!template) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Add viral hooks
    data.hook = this.selectViralHook(report);
    
    // Generate shortened URL for tracking
    data.shortUrl = await this.generateShortUrl(data.url, platform);
    
    // Process template
    const content = this.processTemplate(template, data);
    
    // Add UTM parameters
    content.url = this.addUTMParams(content.url || data.url, platform);
    
    return content;
  }

  extractReportData(report) {
    const summary = report.executiveSummary;
    const metrics = summary.keyMetrics;
    
    return {
      conference: report.metadata.conferenceName,
      attendeeName: report.metadata.attendeeName,
      pipeline: metrics.pipelineGenerated,
      leads: metrics.qualifiedLeads,
      connections: metrics.newConnections,
      efficiency: metrics.timeEfficiency,
      roi: this.calculateROI(report),
      dealSize: this.calculateAverageDealSize(report),
      payback: this.calculatePaybackPeriod(report),
      takeaways: this.formatTakeaways(summary.keyTakeaways),
      businessValue: this.formatBusinessValue(summary.businessValue),
      nextSteps: this.formatNextSteps(summary.nextSteps),
      url: `${window.location.origin}/reports/${report.id}`,
      views: Math.floor(Math.random() * 1000) + 500,
      shares: Math.floor(Math.random() * 100) + 50,
      conversions: Math.floor(Math.random() * 50) + 10,
      quarter: this.getCurrentQuarter(),
      nextConference: this.getNextConference(report)
    };
  }

  processTemplate(template, data) {
    if (typeof template === 'string') {
      return this.replaceVariables(template, data);
    }
    
    const processed = {};
    for (const key in template) {
      if (typeof template[key] === 'string') {
        processed[key] = this.replaceVariables(template[key], data);
      } else if (Array.isArray(template[key])) {
        processed[key] = template[key].map(item => 
          this.processTemplate(item, data)
        );
      } else if (typeof template[key] === 'object') {
        processed[key] = this.processTemplate(template[key], data);
      } else {
        processed[key] = template[key];
      }
    }
    return processed;
  }

  replaceVariables(text, data) {
    return text.replace(/{(\w+)}/g, (match, key) => {
      return data[key] || match;
    });
  }

  selectViralHook(report) {
    const hooks = [];
    
    // Add curiosity hooks for high ROI
    if (this.calculateROI(report) > 500) {
      hooks.push(...this.viralHooks.curiosity);
    }
    
    // Add social proof hooks if report has traction
    if (Math.random() > 0.5) {
      hooks.push(...this.viralHooks.social_proof);
    }
    
    // Add urgency hooks if next conference is soon
    const nextConference = this.getNextConference(report);
    if (nextConference) {
      hooks.push(...this.viralHooks.urgency);
    }
    
    // Add value hooks
    hooks.push(...this.viralHooks.value);
    
    // Select random hook
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  async generateShortUrl(longUrl, platform) {
    // In production, use URL shortening service
    // For now, return a mock shortened URL
    const shortId = Math.random().toString(36).substring(2, 8);
    return `https://conf.rpt/${shortId}`;
  }

  addUTMParams(url, platform) {
    const params = new URLSearchParams({
      utm_source: platform,
      utm_medium: 'social',
      utm_campaign: 'conference_roi_report',
      utm_content: 'executive_summary'
    });
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  calculateROI(report) {
    const investment = report.investment || 15000;
    const returns = this.parseAmount(report.executiveSummary.keyMetrics.pipelineGenerated);
    return Math.round((returns / investment - 1) * 100);
  }

  calculateAverageDealSize(report) {
    const pipeline = this.parseAmount(report.executiveSummary.keyMetrics.pipelineGenerated);
    const leads = parseInt(report.executiveSummary.keyMetrics.qualifiedLeads) || 1;
    const avgSize = Math.round(pipeline / leads);
    return this.formatCurrency(avgSize);
  }

  calculatePaybackPeriod(report) {
    const investment = report.investment || 15000;
    const monthlyReturn = this.parseAmount(report.executiveSummary.keyMetrics.pipelineGenerated) / 12;
    return Math.round(investment / monthlyReturn * 10) / 10;
  }

  formatTakeaways(takeaways) {
    if (!takeaways || takeaways.length === 0) {
      return 'Strategic insights and competitive intelligence gained';
    }
    return takeaways.slice(0, 3).map(t => `• ${t}`).join('\n');
  }

  formatBusinessValue(businessValue) {
    const immediate = businessValue?.immediateValue || [];
    const future = businessValue?.futureValue || [];
    const allValue = [...immediate.slice(0, 2), ...future.slice(0, 1)];
    return allValue.map(v => `• ${v}`).join('\n');
  }

  formatNextSteps(nextSteps) {
    if (!nextSteps || nextSteps.length === 0) {
      return 'Follow up with qualified leads and implement strategic recommendations';
    }
    return nextSteps.slice(0, 3).map(step => `• ${step.title}`).join('\n');
  }

  getCurrentQuarter() {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  getNextConference(report) {
    const upcoming = report.recommendations?.futureStrategy?.upcomingEvents?.[0];
    return upcoming?.name || 'GDC 2025';
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

  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  }

  async generateSocialImage(report) {
    // In production, use server-side image generation
    // For now, return a placeholder
    return '/assets/images/report-social-preview.png';
  }

  async trackShare(reportId, platform, userId) {
    const shareData = {
      reportId,
      platform,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    // In production, send to analytics service
    console.log('Share tracked:', shareData);
    
    // Update local storage for demo
    const shares = JSON.parse(localStorage.getItem('reportShares') || '[]');
    shares.push(shareData);
    localStorage.setItem('reportShares', JSON.stringify(shares));
    
    return true;
  }

  async getShareAnalytics(reportId) {
    // In production, fetch from backend
    const shares = JSON.parse(localStorage.getItem('reportShares') || '[]');
    const reportShares = shares.filter(s => s.reportId === reportId);
    
    const analytics = {
      totalShares: reportShares.length,
      byPlatform: {},
      timeline: [],
      virality: {
        coefficient: this.calculateViralityCoefficient(reportShares),
        trend: 'increasing',
        predictedReach: reportShares.length * 150
      }
    };
    
    // Group by platform
    reportShares.forEach(share => {
      analytics.byPlatform[share.platform] = (analytics.byPlatform[share.platform] || 0) + 1;
    });
    
    // Create timeline
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = reportShares.filter(s => 
        s.timestamp.startsWith(dateStr)
      ).length;
      analytics.timeline.push({ date: dateStr, shares: count });
    }
    
    return analytics;
  }

  calculateViralityCoefficient(shares) {
    // Simple virality coefficient calculation
    // K = i * c where i = invites sent, c = conversion rate
    const invitesSent = shares.length;
    const conversionRate = 0.15; // Assume 15% conversion
    return (invitesSent * conversionRate).toFixed(2);
  }

  generateShareableInsights(report) {
    const insights = [];
    const metrics = report.executiveSummary.keyMetrics;
    
    // ROI insight
    const roi = this.calculateROI(report);
    if (roi > 500) {
      insights.push({
        type: 'roi',
        text: `Achieved ${roi}% ROI from conference investment`,
        impact: 'high',
        shareability: 0.9
      });
    }
    
    // Pipeline insight
    if (metrics.pipelineGenerated) {
      insights.push({
        type: 'pipeline',
        text: `Generated ${metrics.pipelineGenerated} in qualified pipeline`,
        impact: 'high',
        shareability: 0.85
      });
    }
    
    // Network insight
    if (parseInt(metrics.newConnections) > 50) {
      insights.push({
        type: 'network',
        text: `Expanded professional network by ${metrics.newConnections} strategic connections`,
        impact: 'medium',
        shareability: 0.7
      });
    }
    
    // Efficiency insight
    if (metrics.timeEfficiency) {
      insights.push({
        type: 'efficiency',
        text: `${metrics.timeEfficiency} more efficient than industry average`,
        impact: 'medium',
        shareability: 0.6
      });
    }
    
    // Sort by shareability
    return insights.sort((a, b) => b.shareability - a.shareability);
  }
}

export { SocialShareManager };