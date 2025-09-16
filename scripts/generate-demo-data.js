#!/usr/bin/env node

/**
 * Demo Data Generator for Events Company Presentation
 * Generates impressive, realistic data for all dashboards
 */

const fs = require('fs');
const path = require('path');

class DemoDataGenerator {
  constructor() {
    this.companies = [
      'Microsoft', 'Google', 'Amazon', 'Apple', 'Meta',
      'Tesla', 'NVIDIA', 'Adobe', 'Salesforce', 'Oracle',
      'IBM', 'Intel', 'AMD', 'Spotify', 'Netflix'
    ];

    this.roles = [
      'VP Engineering', 'Product Director', 'CTO', 'Head of Sales',
      'Marketing Director', 'Business Development', 'CEO', 'COO',
      'Investment Partner', 'Game Developer', 'Studio Head'
    ];

    this.eventNames = [
      'Executive Summit', 'Developer Conference', 'Innovation Showcase',
      'Partner Meeting', 'Tech Talk', 'Networking Mixer', 'VIP Reception',
      'Strategy Session', 'Product Launch', 'Investor Pitch'
    ];
  }

  generateExecutiveData() {
    return {
      overview: {
        eventName: 'Global Gaming Summit 2025',
        dateRange: 'March 15-18, 2025',
        totalInvestment: 250000,
        currentROI: 3.2,
        projectedROI: 4.1,
        daysRemaining: 45
      },

      metrics: {
        attendees: {
          total: 15847,
          vip: 234,
          speakers: 89,
          exhibitors: 456,
          media: 123
        },

        engagement: {
          avgSessionTime: '34 min',
          connectionsPerUser: 23,
          messagesExchanged: 125000,
          meetingsScheduled: 3456,
          documentsShared: 8901
        },

        pipeline: {
          total: 4200000,
          qualified: 847,
          inProgress: 234,
          closed: 89,
          avgDealSize: 125000
        },

        teamPerformance: this.generateTeamData()
      }
    };
  }

  generateTeamData() {
    const teamMembers = [
      { name: 'Sarah Chen', role: 'Sales Director', avatar: '👩‍💼' },
      { name: 'Michael Ross', role: 'BD Manager', avatar: '👨‍💼' },
      { name: 'Elena Vasquez', role: 'Marketing Lead', avatar: '👩‍💻' },
      { name: 'James Park', role: 'Account Executive', avatar: '👨‍💻' },
      { name: 'Aisha Patel', role: 'Customer Success', avatar: '👩‍🔬' },
      { name: 'Tom Williams', role: 'Sales Rep', avatar: '👨‍🔧' },
      { name: 'Lisa Zhang', role: 'Partnerships', avatar: '👩‍🎨' },
      { name: 'David Kim', role: 'Solutions Architect', avatar: '👨‍🎨' }
    ];

    return teamMembers.map(member => ({
      ...member,
      connections: Math.floor(Math.random() * 150) + 50,
      meetings: Math.floor(Math.random() * 40) + 10,
      pipeline: Math.floor(Math.random() * 2000000) + 500000,
      deals: Math.floor(Math.random() * 20) + 5,
      score: Math.floor(Math.random() * 30) + 70,
      trend: Math.random() > 0.3 ? 'up' : 'stable'
    }));
  }

  generateAIInsights() {
    return {
      predictions: {
        nextQuarterROI: 3.8,
        confidence: 0.89,
        topOpportunities: [
          {
            company: 'Microsoft Gaming',
            probability: 0.92,
            value: 1200000,
            nextStep: 'Schedule executive meeting'
          },
          {
            company: 'Sony Interactive',
            probability: 0.87,
            value: 800000,
            nextStep: 'Send partnership proposal'
          },
          {
            company: 'Epic Games',
            probability: 0.84,
            value: 650000,
            nextStep: 'Technical demonstration'
          }
        ]
      },

      insights: [
        {
          type: 'trend',
          title: 'AR/VR Interest Spike',
          description: 'Detected 340% increase in AR/VR related conversations',
          action: 'Increase AR/VR demo stations'
        },
        {
          type: 'connection',
          title: 'High-Value Network Cluster',
          description: 'Identified 23 decision makers in gaming infrastructure',
          action: 'Organize exclusive roundtable'
        },
        {
          type: 'opportunity',
          title: 'Partnership Potential',
          description: 'AI matched 45 complementary businesses',
          action: 'Facilitate introductions'
        }
      ],

      nlpAnalysis: {
        topTopics: [
          { topic: 'Cloud Gaming', mentions: 1234, sentiment: 0.82 },
          { topic: 'AI in Games', mentions: 987, sentiment: 0.91 },
          { topic: 'Blockchain Gaming', mentions: 654, sentiment: 0.73 },
          { topic: 'Mobile Gaming', mentions: 543, sentiment: 0.88 },
          { topic: 'Esports', mentions: 432, sentiment: 0.95 }
        ],

        sentimentTrend: [
          { time: '9 AM', score: 0.75 },
          { time: '10 AM', score: 0.78 },
          { time: '11 AM', score: 0.82 },
          { time: '12 PM', score: 0.80 },
          { time: '1 PM', score: 0.85 },
          { time: '2 PM', score: 0.89 },
          { time: '3 PM', score: 0.91 }
        ]
      }
    };
  }

  generateRealtimeActivity() {
    const activities = [];
    const now = Date.now();

    for (let i = 0; i < 20; i++) {
      const mins = Math.floor(Math.random() * 60);
      activities.push({
        timestamp: new Date(now - mins * 60000).toISOString(),
        type: ['connection', 'meeting', 'deal', 'message'][Math.floor(Math.random() * 4)],
        user: this.getRandomName(),
        company: this.companies[Math.floor(Math.random() * this.companies.length)],
        value: Math.floor(Math.random() * 500000) + 10000,
        icon: ['🤝', '📅', '💼', '💬'][Math.floor(Math.random() * 4)]
      });
    }

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  generateGatherings() {
    return [
      {
        id: 'g001',
        title: '☕ Coffee with Gaming VCs',
        time: '2:00 PM',
        location: 'Networking Lounge',
        attendees: 8,
        maxAttendees: 12,
        tags: ['Investment', 'Gaming', 'Startups'],
        aiScore: 0.94,
        description: 'AI matched you with 3 VCs interested in your vertical'
      },
      {
        id: 'g002',
        title: '🎮 Indie Dev Collaboration',
        time: '3:30 PM',
        location: 'Developer Zone',
        attendees: 15,
        maxAttendees: 20,
        tags: ['Indie', 'Development', 'Collaboration'],
        aiScore: 0.87,
        description: 'Connect with developers using similar tech stacks'
      },
      {
        id: 'g003',
        title: '🚀 Web3 Gaming Roundtable',
        time: '4:00 PM',
        location: 'Innovation Hub',
        attendees: 6,
        maxAttendees: 10,
        tags: ['Web3', 'Blockchain', 'NFT'],
        aiScore: 0.91,
        description: 'Exclusive discussion on blockchain gaming future'
      }
    ];
  }

  generateWhiteLabelClients() {
    return [
      {
        name: 'TechCrunch Disrupt',
        logo: '🚀',
        primaryColor: '#00D084',
        attendees: 10000,
        status: 'Live'
      },
      {
        name: 'Web Summit',
        logo: '🌐',
        primaryColor: '#FF6B6B',
        attendees: 70000,
        status: 'Live'
      },
      {
        name: 'CES 2025',
        logo: '💡',
        primaryColor: '#0066CC',
        attendees: 180000,
        status: 'Deploying'
      },
      {
        name: 'Game Developers Conference',
        logo: '🎮',
        primaryColor: '#8B5CF6',
        attendees: 30000,
        status: 'Live'
      }
    ];
  }

  getRandomName() {
    const firstNames = ['John', 'Sarah', 'Michael', 'Elena', 'David', 'Lisa', 'James', 'Aisha'];
    const lastNames = ['Smith', 'Johnson', 'Chen', 'Patel', 'Kim', 'Williams', 'Garcia', 'Ross'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  generateFullDemoData() {
    return {
      generated: new Date().toISOString(),
      executive: this.generateExecutiveData(),
      ai: this.generateAIInsights(),
      activity: this.generateRealtimeActivity(),
      gatherings: this.generateGatherings(),
      whiteLabelClients: this.generateWhiteLabelClients(),

      // Quick stats for demo
      quickStats: {
        totalRevenue: '$4.2M',
        activeEvents: 23,
        totalUsers: 125847,
        npsScore: 92,
        uptime: '99.99%',
        apiCalls: '12.5M',
        dataProcessed: '2.3TB',
        aiPredictions: '45K/day'
      }
    };
  }

  saveToFile(data) {
    const outputPath = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'data', 'demo-data.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Demo data generated: ${outputPath}`);

    // Also create a JavaScript module
    const jsPath = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'js', 'demo-data.js');
    const jsContent = `// Auto-generated demo data
export const demoData = ${JSON.stringify(data, null, 2)};

// Helper to get demo data
window.getDemoData = () => demoData;

export default demoData;`;

    fs.writeFileSync(jsPath, jsContent);
    console.log(`✅ Demo data module created: ${jsPath}`);
  }

  generateAndSave() {
    const data = this.generateFullDemoData();
    this.saveToFile(data);

    // Display summary
    console.log('\n📊 Demo Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Investment: $${data.executive.overview.totalInvestment.toLocaleString()}`);
    console.log(`Current ROI: ${data.executive.overview.currentROI}x`);
    console.log(`Pipeline Value: $${data.executive.metrics.pipeline.total.toLocaleString()}`);
    console.log(`Team Members: ${data.executive.metrics.teamPerformance.length}`);
    console.log(`AI Predictions: ${data.ai.predictions.topOpportunities.length}`);
    console.log(`Live Activities: ${data.activity.length}`);
    console.log(`Smart Gatherings: ${data.gatherings.length}`);
    console.log(`White Label Clients: ${data.whiteLabelClients.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return data;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new DemoDataGenerator();
  generator.generateAndSave();
}

module.exports = DemoDataGenerator;