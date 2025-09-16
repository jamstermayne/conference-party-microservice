/**
 * PDF Report Generator
 * Creates professional PDF reports from conference data and insights
 */

class PDFGenerator {
  constructor(options = {}) {
    this.options = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      margin: options.margin || 20,
      theme: options.theme || 'professional',
      includeCharts: options.includeCharts !== false,
      includeNetwork: options.includeNetwork !== false,
      quality: options.quality || 'high',
      ...options
    };
    
    this.fonts = new Map();
    this.images = new Map();
    this.charts = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize PDF generator
   */
  async initialize() {
    try {
      // Load required dependencies (simulate async loading)
      await this.loadFonts();
      await this.loadTemplates();
      console.log('[PDFGenerator] Initialized successfully');
    } catch (error) {
      console.error('[PDFGenerator] Initialization failed:', error);
    }
  }
  
  /**
   * Load fonts for PDF generation
   */
  async loadFonts() {
    // Mock font loading - in real implementation, would load actual font files
    this.fonts.set('regular', 'system-ui');
    this.fonts.set('bold', 'system-ui');
    this.fonts.set('italic', 'system-ui');
  }
  
  /**
   * Load report templates
   */
  async loadTemplates() {
    this.templates = {
      personal: this.getPersonalTemplate(),
      executive: this.getExecutiveTemplate(),
      network: this.getNetworkTemplate(),
      summary: this.getSummaryTemplate()
    };
  }
  
  /**
   * Generate personal report PDF
   */
  async generatePersonalReport(reportData, options = {}) {
    try {
      console.log('[PDFGenerator] Generating personal report...');
      
      const config = { ...this.options, ...options };
      const pdf = await this.createPDFDocument(config);
      
      // Add cover page
      await this.addCoverPage(pdf, reportData, 'personal');
      
      // Add executive summary
      await this.addExecutiveSummary(pdf, reportData.executiveSummary);
      
      // Add personal insights
      await this.addPersonalInsights(pdf, reportData.personalInsights);
      
      // Add network analysis
      if (config.includeNetwork) {
        await this.addNetworkAnalysis(pdf, reportData.networkAnalysis);
      }
      
      // Add learning outcomes
      await this.addLearningOutcomes(pdf, reportData.learningOutcomes);
      
      // Add recommendations
      await this.addRecommendations(pdf, reportData.recommendations);
      
      // Add appendix
      await this.addAppendix(pdf, reportData);
      
      return await this.finalizePDF(pdf, 'personal_report');
      
    } catch (error) {
      console.error('[PDFGenerator] Personal report generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate executive report PDF
   */
  async generateExecutiveReport(reportData, options = {}) {
    try {
      console.log('[PDFGenerator] Generating executive report...');
      
      const config = { ...this.options, ...options };
      const pdf = await this.createPDFDocument(config);
      
      // Add cover page
      await this.addCoverPage(pdf, reportData, 'executive');
      
      // Add executive dashboard
      await this.addExecutiveDashboard(pdf, reportData.executiveMetrics);
      
      // Add ROI analysis
      await this.addROIAnalysis(pdf, reportData.roiAnalysis);
      
      // Add team insights
      await this.addTeamInsights(pdf, reportData.teamInsights);
      
      // Add competitive intelligence
      await this.addCompetitiveIntelligence(pdf, reportData.competitiveIntelligence);
      
      // Add strategic recommendations
      await this.addStrategicRecommendations(pdf, reportData.strategicRecommendations);
      
      return await this.finalizePDF(pdf, 'executive_report');
      
    } catch (error) {
      console.error('[PDFGenerator] Executive report generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Create PDF document
   */
  async createPDFDocument(config) {
    // Mock PDF document creation
    const pdf = {
      config,
      pages: [],
      currentPage: null,
      pageNumber: 0,
      metadata: {
        title: '',
        author: 'Conference Intelligence Platform',
        creator: 'Professional Networking System',
        creationDate: new Date()
      }
    };
    
    return pdf;
  }
  
  /**
   * Add cover page
   */
  async addCoverPage(pdf, reportData, type) {
    const page = this.createPage(pdf);
    const { width, height } = this.getPageDimensions();
    
    // Header section
    this.addText(page, {
      text: type === 'executive' ? 'Executive Intelligence Report' : 'Personal Conference Insights',
      x: width / 2,
      y: height * 0.2,
      size: 28,
      weight: 'bold',
      align: 'center',
      color: '#1f2937'
    });
    
    // Conference info
    this.addText(page, {
      text: reportData.metadata.conferenceName || 'Professional Conference',
      x: width / 2,
      y: height * 0.3,
      size: 20,
      align: 'center',
      color: '#6b7280'
    });
    
    this.addText(page, {
      text: new Date(reportData.metadata.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      x: width / 2,
      y: height * 0.35,
      size: 14,
      align: 'center',
      color: '#9ca3af'
    });
    
    // Key metrics preview
    const keyMetrics = this.getKeyMetrics(reportData);
    let yPosition = height * 0.5;
    
    this.addText(page, {
      text: 'Key Highlights',
      x: width / 2,
      y: yPosition,
      size: 18,
      weight: 'bold',
      align: 'center',
      color: '#374151'
    });
    
    yPosition += 40;
    keyMetrics.forEach(metric => {
      this.addText(page, {
        text: `${metric.label}: ${metric.value}`,
        x: width / 2,
        y: yPosition,
        size: 14,
        align: 'center',
        color: '#4b5563'
      });
      yPosition += 25;
    });
    
    // Footer
    this.addText(page, {
      text: 'Generated by Professional Intelligence Platform',
      x: width / 2,
      y: height * 0.9,
      size: 10,
      align: 'center',
      color: '#9ca3af'
    });
  }
  
  /**
   * Add executive summary
   */
  async addExecutiveSummary(pdf, summaryData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    // Section header
    this.addSectionHeader(page, 'Executive Summary', yPosition);
    yPosition += 50;
    
    // Key insights
    if (summaryData.keyInsights) {
      this.addText(page, {
        text: 'Key Insights',
        x: 40,
        y: yPosition,
        size: 16,
        weight: 'bold',
        color: '#374151'
      });
      yPosition += 30;
      
      summaryData.keyInsights.forEach(insight => {
        this.addBulletPoint(page, insight, 60, yPosition);
        yPosition += 20;
      });
      yPosition += 20;
    }
    
    // Performance metrics
    if (summaryData.performanceMetrics) {
      this.addText(page, {
        text: 'Performance Overview',
        x: 40,
        y: yPosition,
        size: 16,
        weight: 'bold',
        color: '#374151'
      });
      yPosition += 30;
      
      const metrics = Object.entries(summaryData.performanceMetrics);
      metrics.forEach(([key, value]) => {
        this.addText(page, {
          text: `${this.formatMetricLabel(key)}: ${value}`,
          x: 60,
          y: yPosition,
          size: 12,
          color: '#4b5563'
        });
        yPosition += 18;
      });
    }
  }
  
  /**
   * Add personal insights
   */
  async addPersonalInsights(pdf, insightsData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Personal Insights', yPosition);
    yPosition += 50;
    
    // Networking analysis
    if (insightsData.networking) {
      this.addSubsectionHeader(page, 'Networking Performance', yPosition);
      yPosition += 30;
      
      const networkingText = this.generateNetworkingText(insightsData.networking);
      yPosition = this.addParagraph(page, networkingText, 40, yPosition, { width: 520 });
      yPosition += 30;
    }
    
    // Learning analysis
    if (insightsData.learning) {
      this.addSubsectionHeader(page, 'Learning & Development', yPosition);
      yPosition += 30;
      
      const learningText = this.generateLearningText(insightsData.learning);
      yPosition = this.addParagraph(page, learningText, 40, yPosition, { width: 520 });
      yPosition += 30;
    }
    
    // Opportunity analysis
    if (insightsData.opportunities) {
      this.addSubsectionHeader(page, 'Opportunity Assessment', yPosition);
      yPosition += 30;
      
      const opportunityText = this.generateOpportunityText(insightsData.opportunities);
      yPosition = this.addParagraph(page, opportunityText, 40, yPosition, { width: 520 });
    }
  }
  
  /**
   * Add network analysis
   */
  async addNetworkAnalysis(pdf, networkData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Network Analysis', yPosition);
    yPosition += 50;
    
    // Network visualization placeholder
    if (this.options.includeCharts) {
      this.addChartPlaceholder(page, 'Network Graph', 40, yPosition, 520, 300);
      yPosition += 350;
    }
    
    // Network statistics
    if (networkData.statistics) {
      this.addSubsectionHeader(page, 'Network Statistics', yPosition);
      yPosition += 30;
      
      const stats = networkData.statistics;
      const statsTable = [
        ['Metric', 'Value'],
        ['Total Connections', stats.totalConnections],
        ['Strong Connections', stats.strongConnections],
        ['Network Density', `${Math.round(stats.networkDensity * 100)}%`],
        ['Clustering Coefficient', stats.clusteringCoefficient?.toFixed(3)],
        ['Average Path Length', stats.averagePathLength?.toFixed(2)]
      ];
      
      this.addTable(page, statsTable, 40, yPosition);
    }
  }
  
  /**
   * Add learning outcomes
   */
  async addLearningOutcomes(pdf, learningData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Learning Outcomes', yPosition);
    yPosition += 50;
    
    // Skills acquired
    if (learningData.skillsAcquired) {
      this.addSubsectionHeader(page, 'Skills Acquired', yPosition);
      yPosition += 30;
      
      learningData.skillsAcquired.forEach(skill => {
        this.addBulletPoint(page, `${skill.name} (${skill.proficiency})`, 60, yPosition);
        yPosition += 20;
      });
      yPosition += 20;
    }
    
    // Knowledge gaps
    if (learningData.knowledgeGaps) {
      this.addSubsectionHeader(page, 'Areas for Development', yPosition);
      yPosition += 30;
      
      learningData.knowledgeGaps.forEach(gap => {
        this.addBulletPoint(page, gap, 60, yPosition);
        yPosition += 20;
      });
    }
  }
  
  /**
   * Add recommendations
   */
  async addRecommendations(pdf, recommendations) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Recommendations', yPosition);
    yPosition += 50;
    
    // Immediate actions
    if (recommendations.immediate) {
      this.addSubsectionHeader(page, 'Immediate Actions', yPosition);
      yPosition += 30;
      
      recommendations.immediate.forEach((action, index) => {
        this.addNumberedPoint(page, action, index + 1, 60, yPosition);
        yPosition += 25;
      });
      yPosition += 20;
    }
    
    // Long-term strategies
    if (recommendations.longTerm) {
      this.addSubsectionHeader(page, 'Long-term Strategies', yPosition);
      yPosition += 30;
      
      recommendations.longTerm.forEach((strategy, index) => {
        this.addNumberedPoint(page, strategy, index + 1, 60, yPosition);
        yPosition += 25;
      });
    }
  }
  
  /**
   * Add appendix
   */
  async addAppendix(pdf, reportData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Appendix', yPosition);
    yPosition += 50;
    
    // Data sources
    this.addSubsectionHeader(page, 'Data Sources', yPosition);
    yPosition += 30;
    
    const dataSources = [
      'Conference attendance records',
      'Networking interaction logs',
      'Event participation data',
      'Opportunity engagement metrics',
      'Learning assessment scores'
    ];
    
    dataSources.forEach(source => {
      this.addBulletPoint(page, source, 60, yPosition);
      yPosition += 20;
    });
    
    yPosition += 30;
    
    // Methodology
    this.addSubsectionHeader(page, 'Methodology', yPosition);
    yPosition += 30;
    
    const methodology = 'This report was generated using advanced analytics algorithms that process multiple data points including interaction patterns, engagement metrics, learning assessments, and opportunity matching scores. All personal data is processed in accordance with privacy regulations and anonymized where appropriate.';
    
    this.addParagraph(page, methodology, 40, yPosition, { width: 520 });
  }
  
  /**
   * Add executive dashboard
   */
  async addExecutiveDashboard(pdf, executiveMetrics) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Executive Dashboard', yPosition);
    yPosition += 50;
    
    // Key performance indicators
    const kpis = [
      { label: 'Team Network Growth', value: `${executiveMetrics.networkGrowth}%`, color: '#10b981' },
      { label: 'Knowledge Transfer Rate', value: `${executiveMetrics.knowledgeTransfer}%`, color: '#3b82f6' },
      { label: 'Opportunity Conversion', value: `${executiveMetrics.opportunityConversion}%`, color: '#f59e0b' },
      { label: 'ROI Achievement', value: `${executiveMetrics.roiAchievement}%`, color: '#8b5cf6' }
    ];
    
    this.addKPIGrid(page, kpis, 40, yPosition);
  }
  
  /**
   * Add ROI analysis
   */
  async addROIAnalysis(pdf, roiData) {
    const page = this.createPage(pdf);
    let yPosition = 60;
    
    this.addSectionHeader(page, 'Return on Investment Analysis', yPosition);
    yPosition += 50;
    
    // Investment breakdown
    if (roiData.investment) {
      this.addSubsectionHeader(page, 'Investment Breakdown', yPosition);
      yPosition += 30;
      
      const investmentTable = [
        ['Category', 'Amount', 'Percentage'],
        ['Registration Fees', `$${roiData.investment.registration}`, '40%'],
        ['Travel & Accommodation', `$${roiData.investment.travel}`, '35%'],
        ['Opportunity Cost', `$${roiData.investment.opportunityCost}`, '25%']
      ];
      
      yPosition = this.addTable(page, investmentTable, 40, yPosition);
      yPosition += 30;
    }
    
    // Value generated
    if (roiData.value) {
      this.addSubsectionHeader(page, 'Value Generated', yPosition);
      yPosition += 30;
      
      const valueTable = [
        ['Source', 'Value', 'Confidence'],
        ['New Business Opportunities', `$${roiData.value.opportunities}`, '85%'],
        ['Knowledge & Skills Gained', `$${roiData.value.knowledge}`, '75%'],
        ['Network Value', `$${roiData.value.network}`, '60%'],
        ['Partnership Potential', `$${roiData.value.partnerships}`, '70%']
      ];
      
      this.addTable(page, valueTable, 40, yPosition);
    }
  }
  
  /**
   * Create a new page
   */
  createPage(pdf) {
    const page = {
      number: ++pdf.pageNumber,
      elements: [],
      charts: [],
      images: []
    };
    
    pdf.pages.push(page);
    pdf.currentPage = page;
    
    return page;
  }
  
  /**
   * Add text to page
   */
  addText(page, options) {
    page.elements.push({
      type: 'text',
      ...options
    });
  }
  
  /**
   * Add section header
   */
  addSectionHeader(page, title, yPosition) {
    this.addText(page, {
      text: title,
      x: 40,
      y: yPosition,
      size: 20,
      weight: 'bold',
      color: '#1f2937'
    });
    
    // Add underline
    page.elements.push({
      type: 'line',
      x1: 40,
      y1: yPosition + 25,
      x2: 550,
      y2: yPosition + 25,
      stroke: '#e5e7eb',
      strokeWidth: 1
    });
  }
  
  /**
   * Add subsection header
   */
  addSubsectionHeader(page, title, yPosition) {
    this.addText(page, {
      text: title,
      x: 40,
      y: yPosition,
      size: 16,
      weight: 'bold',
      color: '#374151'
    });
  }
  
  /**
   * Add paragraph with text wrapping
   */
  addParagraph(page, text, x, y, options = {}) {
    const { width = 520, lineHeight = 18, size = 12 } = options;
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const lineWidth = this.getTextWidth(testLine, size);
      
      if (lineWidth <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          this.addText(page, {
            text: currentLine,
            x,
            y: currentY,
            size,
            color: '#4b5563'
          });
          currentY += lineHeight;
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      this.addText(page, {
        text: currentLine,
        x,
        y: currentY,
        size,
        color: '#4b5563'
      });
      currentY += lineHeight;
    }
    
    return currentY;
  }
  
  /**
   * Add bullet point
   */
  addBulletPoint(page, text, x, y) {
    this.addText(page, {
      text: '•',
      x: x - 15,
      y,
      size: 12,
      color: '#6b7280'
    });
    
    this.addText(page, {
      text: text,
      x,
      y,
      size: 12,
      color: '#4b5563'
    });
  }
  
  /**
   * Add numbered point
   */
  addNumberedPoint(page, text, number, x, y) {
    this.addText(page, {
      text: `${number}.`,
      x: x - 20,
      y,
      size: 12,
      weight: 'bold',
      color: '#6b7280'
    });
    
    this.addText(page, {
      text: text,
      x,
      y,
      size: 12,
      color: '#4b5563'
    });
  }
  
  /**
   * Add table
   */
  addTable(page, data, x, y) {
    const rowHeight = 25;
    const colWidths = this.calculateColumnWidths(data);
    let currentY = y;
    
    data.forEach((row, rowIndex) => {
      let currentX = x;
      
      row.forEach((cell, colIndex) => {
        // Add cell background for header
        if (rowIndex === 0) {
          page.elements.push({
            type: 'rect',
            x: currentX,
            y: currentY - 15,
            width: colWidths[colIndex],
            height: rowHeight,
            fill: '#f3f4f6',
            stroke: '#e5e7eb'
          });
        }
        
        this.addText(page, {
          text: cell.toString(),
          x: currentX + 10,
          y: currentY,
          size: rowIndex === 0 ? 12 : 11,
          weight: rowIndex === 0 ? 'bold' : 'normal',
          color: rowIndex === 0 ? '#1f2937' : '#4b5563'
        });
        
        currentX += colWidths[colIndex];
      });
      
      currentY += rowHeight;
    });
    
    return currentY + 20;
  }
  
  /**
   * Add KPI grid
   */
  addKPIGrid(page, kpis, x, y) {
    const cardWidth = 120;
    const cardHeight = 80;
    const spacing = 20;
    
    kpis.forEach((kpi, index) => {
      const cardX = x + (index * (cardWidth + spacing));
      
      // Card background
      page.elements.push({
        type: 'rect',
        x: cardX,
        y: y,
        width: cardWidth,
        height: cardHeight,
        fill: '#ffffff',
        stroke: '#e5e7eb',
        strokeWidth: 1,
        rx: 8
      });
      
      // Value
      this.addText(page, {
        text: kpi.value,
        x: cardX + cardWidth/2,
        y: y + 25,
        size: 20,
        weight: 'bold',
        align: 'center',
        color: kpi.color
      });
      
      // Label
      this.addText(page, {
        text: kpi.label,
        x: cardX + cardWidth/2,
        y: y + 50,
        size: 10,
        align: 'center',
        color: '#6b7280'
      });
    });
  }
  
  /**
   * Add chart placeholder
   */
  addChartPlaceholder(page, title, x, y, width, height) {
    page.elements.push({
      type: 'rect',
      x,
      y,
      width,
      height,
      fill: '#f9fafb',
      stroke: '#e5e7eb',
      strokeWidth: 1
    });
    
    this.addText(page, {
      text: `[${title} Chart]`,
      x: x + width/2,
      y: y + height/2,
      size: 14,
      align: 'center',
      color: '#9ca3af'
    });
  }
  
  /**
   * Get text width (approximation)
   */
  getTextWidth(text, size) {
    // Approximate text width calculation
    return text.length * size * 0.6;
  }
  
  /**
   * Calculate column widths for table
   */
  calculateColumnWidths(data) {
    const numCols = data[0].length;
    const totalWidth = 520;
    return Array(numCols).fill(totalWidth / numCols);
  }
  
  /**
   * Get page dimensions
   */
  getPageDimensions() {
    // A4 dimensions in points (72 DPI)
    return { width: 595, height: 842 };
  }
  
  /**
   * Get key metrics for cover page
   */
  getKeyMetrics(reportData) {
    return [
      { label: 'New Connections', value: reportData.personalInsights?.networking?.totalConnections || 0 },
      { label: 'Events Attended', value: reportData.personalInsights?.engagement?.eventsAttended || 0 },
      { label: 'Learning Hours', value: `${Math.round((reportData.personalInsights?.learning?.totalLearningTime || 0) / 60)}h` },
      { label: 'Opportunities', value: reportData.personalInsights?.opportunities?.interestedOpportunities || 0 }
    ];
  }
  
  /**
   * Generate networking text
   */
  generateNetworkingText(networkingData) {
    return `Your networking performance was exceptional, establishing ${networkingData.totalConnections} meaningful connections with a ${Math.round(networkingData.averageConnectionStrength * 100)}% average relationship strength. You successfully diversified across ${networkingData.companiesRepresented} companies and ${networkingData.rolesRepresented} different roles, creating a robust professional network foundation.`;
  }
  
  /**
   * Generate learning text
   */
  generateLearningText(learningData) {
    return `You invested ${Math.round(learningData.totalLearningTime / 60)} hours in learning activities, engaging with ${learningData.topicsEngaged} different topics. Your knowledge gain score of ${Math.round(learningData.knowledgeGainScore * 100)}% indicates strong absorption and practical application potential.`;
  }
  
  /**
   * Generate opportunity text
   */
  generateOpportunityText(opportunityData) {
    return `${opportunityData.totalOpportunities} opportunities were identified during the conference, with ${opportunityData.interestedOpportunities} matching your interests and career goals. This represents a ${Math.round(opportunityData.interestRate * 100)}% alignment rate, indicating excellent opportunity targeting.`;
  }
  
  /**
   * Format metric label
   */
  formatMetricLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  /**
   * Finalize PDF and return download data
   */
  async finalizePDF(pdf, filename) {
    // Mock PDF finalization - in real implementation would generate actual PDF
    const pdfData = {
      filename: `${filename}_${Date.now()}.pdf`,
      pages: pdf.pages.length,
      size: this.calculatePDFSize(pdf),
      metadata: pdf.metadata,
      download: this.createDownloadData(pdf, filename)
    };
    
    console.log(`[PDFGenerator] Generated ${filename} with ${pdf.pages.length} pages`);
    return pdfData;
  }
  
  /**
   * Calculate PDF size
   */
  calculatePDFSize(pdf) {
    // Mock size calculation
    return pdf.pages.length * 50 + 100; // KB
  }
  
  /**
   * Create download data
   */
  createDownloadData(pdf, filename) {
    // Mock PDF content for download
    const pdfContent = JSON.stringify({
      type: 'PDF_REPORT',
      filename,
      pages: pdf.pages,
      metadata: pdf.metadata,
      generatedAt: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([pdfContent], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }
  
  /**
   * Get personal template
   */
  getPersonalTemplate() {
    return {
      name: 'Personal Report Template',
      sections: ['cover', 'executive_summary', 'insights', 'network', 'learning', 'recommendations', 'appendix'],
      colors: {
        primary: '#6366f1',
        secondary: '#10b981',
        accent: '#f59e0b',
        text: '#1f2937',
        muted: '#6b7280'
      }
    };
  }
  
  /**
   * Get executive template
   */
  getExecutiveTemplate() {
    return {
      name: 'Executive Report Template',
      sections: ['cover', 'dashboard', 'roi', 'team_insights', 'competitive', 'strategic'],
      colors: {
        primary: '#1f2937',
        secondary: '#059669',
        accent: '#dc2626',
        text: '#111827',
        muted: '#4b5563'
      }
    };
  }
  
  /**
   * Get network template
   */
  getNetworkTemplate() {
    return {
      name: 'Network Analysis Template',
      sections: ['cover', 'overview', 'analysis', 'visualization', 'insights', 'growth'],
      colors: {
        primary: '#7c3aed',
        secondary: '#0891b2',
        accent: '#ea580c',
        text: '#1f2937',
        muted: '#6b7280'
      }
    };
  }
  
  /**
   * Get summary template
   */
  getSummaryTemplate() {
    return {
      name: 'Summary Report Template',
      sections: ['cover', 'highlights', 'metrics', 'recommendations'],
      colors: {
        primary: '#0f172a',
        secondary: '#0369a1',
        accent: '#c2410c',
        text: '#1e293b',
        muted: '#64748b'
      }
    };
  }
  
  /**
   * Generate and download report
   */
  async generateAndDownload(reportType, reportData, filename) {
    try {
      let pdfData;
      
      switch (reportType) {
        case 'personal':
          pdfData = await this.generatePersonalReport(reportData);
          break;
        case 'executive':
          pdfData = await this.generateExecutiveReport(reportData);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      // Trigger download
      const a = document.createElement('a');
      a.href = pdfData.download;
      a.download = filename || pdfData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(pdfData.download), 1000);
      
      return pdfData;
      
    } catch (error) {
      console.error('[PDFGenerator] Generation and download failed:', error);
      throw error;
    }
  }
  
  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Object.keys(this.templates).map(key => ({
      id: key,
      name: this.templates[key].name,
      sections: this.templates[key].sections,
      colors: this.templates[key].colors
    }));
  }
  
  /**
   * Update generation options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.fonts.clear();
    this.images.clear();
    this.charts.clear();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFGenerator;
}

// Global access
window.PDFGenerator = PDFGenerator;