/**
 * ADVANCED SECURITY MODULE
 * Enterprise-grade security with WAF, DDoS protection, and threat intelligence
 */

import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { apmTracing } from '../observability/APMTracing';

/**
 * Threat intelligence data structure
 */
export interface ThreatIntelligence {
  ip: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  lastSeen: number;
  blocked: boolean;
  reputation: number; // 0-100
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
}

/**
 * Security incident data
 */
export interface SecurityIncident {
  id: string;
  type: 'brute_force' | 'ddos' | 'injection' | 'xss' | 'malware' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
  timestamp: number;
  resolved: boolean;
  responseActions: string[];
}

/**
 * WAF (Web Application Firewall) rule
 */
export interface WAFRule {
  id: string;
  name: string;
  pattern: RegExp;
  action: 'block' | 'monitor' | 'rate_limit';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

/**
 * DDoS protection metrics
 */
export interface DDoSMetrics {
  requestsPerSecond: number;
  uniqueIPs: number;
  suspiciousRequests: number;
  blockedRequests: number;
  threshold: number;
  timeWindow: number;
}

/**
 * Advanced Security Module
 * Comprehensive security protection for enterprise applications
 */
export class AdvancedSecurityModule {
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private securityIncidents: SecurityIncident[] = [];
  private wafRules: Map<string, WAFRule> = new Map();
  private ddosMetrics: DDoSMetrics;
  private requestHistory: Map<string, number[]> = new Map();
  private honeypotTraps: Set<string> = new Set();

  // Security configuration
  private readonly config = {
    // DDoS Protection
    ddosThreshold: 100, // requests per minute
    ddosTimeWindow: 60000, // 1 minute
    ddosBlockDuration: 300000, // 5 minutes
    
    // Rate Limiting
    globalRateLimit: 1000, // per minute
    ipRateLimit: 100, // per minute per IP
    
    // Threat Intelligence
    threatScoreThreshold: 70,
    reputationUpdateInterval: 300000, // 5 minutes
    
    // Anomaly Detection
    anomalyThreshold: 95, // percentile
    learningPeriod: 86400000, // 24 hours
    
    // WAF Settings
    blockSuspiciousPatterns: true,
    logAllRequests: false,
    enableHoneypots: true,
  };

  constructor() {
    this.initializeDDoSMetrics();
    this.initializeWAFRules();
    this.initializeHoneypots();
    this.startBackgroundTasks();
  }

  /**
   * Main security middleware
   */
  public async securityMiddleware(
    req: Request,
    res: Response,
    next: () => void
  ): Promise<void> {
    return apmTracing.traceOperation('Advanced Security Check', {
      ip: req.ip,
      method: req.method,
      path: req.path,
    }, async (span) => {
      const clientIP = this.getClientIP(req);
      const startTime = Date.now();

      try {
        // 1. Threat Intelligence Check
        const threatCheck = await this.checkThreatIntelligence(clientIP);
        if (threatCheck.blocked) {
          this.createSecurityIncident('malware', 'high', clientIP, {
            reason: 'Known malicious IP',
            threatLevel: threatCheck.threatLevel,
          });
          return this.blockRequest(res, 'Access denied - Security threat detected', 403);
        }

        // 2. DDoS Protection
        const ddosCheck = this.checkDDoSProtection(clientIP);
        if (ddosCheck.blocked) {
          this.createSecurityIncident('ddos', 'high', clientIP, {
            reason: 'DDoS attack detected',
            requestsPerSecond: ddosCheck.requestsPerSecond,
          });
          return this.blockRequest(res, 'Rate limit exceeded', 429);
        }

        // 3. WAF (Web Application Firewall)
        const wafCheck = this.checkWAFRules(req);
        if (wafCheck.blocked) {
          this.createSecurityIncident('injection', 'high', clientIP, {
            reason: 'WAF rule triggered',
            rule: wafCheck.rule,
            payload: wafCheck.payload,
          });
          return this.blockRequest(res, 'Request blocked by security policy', 403);
        }

        // 4. Honeypot Detection
        if (this.checkHoneypot(req)) {
          this.createSecurityIncident('anomaly', 'medium', clientIP, {
            reason: 'Honeypot access attempt',
            path: req.path,
          });
          return this.blockRequest(res, 'Not found', 404);
        }

        // 5. Anomaly Detection
        const anomalyCheck = this.detectAnomalies(req, clientIP);
        if (anomalyCheck.suspicious) {
          this.createSecurityIncident('anomaly', 'medium', clientIP, {
            reason: 'Suspicious activity detected',
            anomalies: anomalyCheck.anomalies,
          });
          // Log but allow request to continue
          console.warn(`🚨 Suspicious activity from ${clientIP}:`, anomalyCheck.anomalies);
        }

        // 6. Advanced Input Validation
        const inputValidation = this.validateInputs(req);
        if (!inputValidation.valid) {
          this.createSecurityIncident('injection', 'medium', clientIP, {
            reason: 'Malicious input detected',
            violations: inputValidation.violations,
          });
          return this.blockRequest(res, 'Invalid input detected', 400);
        }

        // 7. Update metrics and continue
        this.updateSecurityMetrics(req, clientIP);
        
        span.setAttributes({
          'security.threat_level': threatCheck.threatLevel || 'none',
          'security.waf_triggered': wafCheck.blocked,
          'security.anomaly_detected': anomalyCheck.suspicious,
          'security.processing_time': Date.now() - startTime,
        });

        // Set security headers
        this.setAdvancedSecurityHeaders(res);

        next();

      } catch (error: any) {
        console.error('Security middleware error:', error);
        this.createSecurityIncident('anomaly', 'low', clientIP, {
          reason: 'Security middleware error',
          error: error.message,
        });
        
        // Allow request to continue on security module errors
        next();
      }
    });
  }

  /**
   * Check threat intelligence database
   */
  private async checkThreatIntelligence(ip: string): Promise<{
    blocked: boolean;
    threatLevel?: string;
    reputation: number;
  }> {
    const threat = this.threatIntelligence.get(ip);
    
    if (!threat) {
      // Query external threat intelligence APIs
      await this.queryExternalThreatDB(ip);
      const updatedThreat = this.threatIntelligence.get(ip);
      
      if (updatedThreat) {
        return {
          blocked: updatedThreat.blocked || updatedThreat.reputation < this.config.threatScoreThreshold,
          threatLevel: updatedThreat.threatLevel,
          reputation: updatedThreat.reputation,
        };
      }
    }

    return {
      blocked: threat ? threat.blocked || threat.reputation < this.config.threatScoreThreshold : false,
      threatLevel: threat?.threatLevel,
      reputation: threat?.reputation || 50,
    };
  }

  /**
   * DDoS protection check
   */
  private checkDDoSProtection(ip: string): {
    blocked: boolean;
    requestsPerSecond: number;
  } {
    const now = Date.now();
    const timeWindow = this.config.ddosTimeWindow;
    
    // Get request history for this IP
    let requests = this.requestHistory.get(ip) || [];
    
    // Remove old requests outside time window
    requests = requests.filter(timestamp => now - timestamp < timeWindow);
    
    // Add current request
    requests.push(now);
    this.requestHistory.set(ip, requests);
    
    const requestsPerMinute = requests.length;
    const requestsPerSecond = requestsPerMinute / 60;
    
    // Update global DDoS metrics
    this.updateDDoSMetrics();
    
    // Check if threshold is exceeded
    const blocked = requestsPerMinute > this.config.ddosThreshold;
    
    if (blocked) {
      console.warn(`🚨 DDoS detected from ${ip}: ${requestsPerMinute} requests/minute`);
    }
    
    return {
      blocked,
      requestsPerSecond,
    };
  }

  /**
   * WAF rules check
   */
  private checkWAFRules(req: Request): {
    blocked: boolean;
    rule?: WAFRule;
    payload?: string;
  } {
    const combinedData = JSON.stringify({
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
    });

    for (const [ruleId, rule] of this.wafRules.entries()) {
      if (!rule.enabled) continue;
      
      if (rule.pattern.test(combinedData)) {
        console.warn(`🛡️ WAF rule triggered: ${rule.name} for IP ${this.getClientIP(req)}`);
        
        if (rule.action === 'block') {
          return {
            blocked: true,
            rule,
            payload: combinedData.substring(0, 200),
          };
        }
        
        if (rule.action === 'monitor') {
          console.log(`📊 WAF monitoring: ${rule.name} triggered but allowing request`);
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Honeypot detection
   */
  private checkHoneypot(req: Request): boolean {
    // Check if accessing honeypot URLs
    return this.honeypotTraps.has(req.path);
  }

  /**
   * Advanced anomaly detection
   */
  private detectAnomalies(req: Request, ip: string): {
    suspicious: boolean;
    anomalies: string[];
  } {
    const anomalies: string[] = [];

    // 1. Unusual request patterns
    if (req.path.length > 500) {
      anomalies.push('extremely_long_path');
    }

    // 2. Suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousUAPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /nikto/i,
      /sqlmap/i,
    ];

    if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
      anomalies.push('suspicious_user_agent');
    }

    // 3. Rapid requests from same IP
    const requests = this.requestHistory.get(ip) || [];
    const recentRequests = requests.filter(t => Date.now() - t < 10000); // Last 10 seconds
    if (recentRequests.length > 20) {
      anomalies.push('rapid_requests');
    }

    // 4. Unusual header combinations
    if (req.headers['x-forwarded-for'] && req.headers['x-real-ip']) {
      anomalies.push('multiple_proxy_headers');
    }

    // 5. Time-based anomalies
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) { // 2 AM - 5 AM
      anomalies.push('unusual_time_activity');
    }

    return {
      suspicious: anomalies.length > 0,
      anomalies,
    };
  }

  /**
   * Advanced input validation
   */
  private validateInputs(req: Request): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check all input sources
    const inputs = [
      JSON.stringify(req.query),
      JSON.stringify(req.body),
      req.url,
    ];

    const maliciousPatterns = [
      // SQL Injection
      { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi, type: 'sql_injection' },
      
      // XSS
      { pattern: /<script[^>]*>.*?<\/script>/gi, type: 'xss_script' },
      { pattern: /javascript:/gi, type: 'xss_javascript' },
      { pattern: /on\w+\s*=/gi, type: 'xss_event_handler' },
      
      // Command Injection
      { pattern: /(\||&&|;|\$\(|\`)/g, type: 'command_injection' },
      
      // Path Traversal
      { pattern: /\.\.[\/\\]/g, type: 'path_traversal' },
      
      // LDAP Injection
      { pattern: /(\(|\)|\||\&)/g, type: 'ldap_injection' },
      
      // XML Injection
      { pattern: /<!\[CDATA\[.*?\]\]>/gi, type: 'xml_injection' },
    ];

    for (const input of inputs) {
      for (const { pattern, type } of maliciousPatterns) {
        if (pattern.test(input)) {
          violations.push(type);
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Initialize WAF rules
   */
  private initializeWAFRules(): void {
    const rules: WAFRule[] = [
      {
        id: 'sql-injection-1',
        name: 'SQL Injection Detection',
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b.*\b(FROM|WHERE|INTO)\b)/gi,
        action: 'block',
        enabled: true,
        severity: 'high',
        tags: ['injection', 'sql'],
      },
      {
        id: 'xss-script-1',
        name: 'XSS Script Tag Detection',
        pattern: /<script[^>]*>.*?<\/script>/gi,
        action: 'block',
        enabled: true,
        severity: 'high',
        tags: ['xss', 'script'],
      },
      {
        id: 'command-injection-1',
        name: 'Command Injection Detection',
        pattern: /(\||&&|;|\$\(|\`|wget|curl|nc|netcat)/gi,
        action: 'block',
        enabled: true,
        severity: 'critical',
        tags: ['injection', 'command'],
      },
      {
        id: 'path-traversal-1',
        name: 'Path Traversal Detection',
        pattern: /\.\.[\/\\]/g,
        action: 'block',
        enabled: true,
        severity: 'medium',
        tags: ['traversal', 'path'],
      },
      {
        id: 'suspicious-scanning-1',
        name: 'Security Scanning Detection',
        pattern: /(nikto|nessus|openvas|nmap|sqlmap|burp|acunetix)/gi,
        action: 'monitor',
        enabled: true,
        severity: 'medium',
        tags: ['scanning', 'reconnaissance'],
      },
    ];

    rules.forEach(rule => {
      this.wafRules.set(rule.id, rule);
    });

    console.log(`🛡️ Initialized ${rules.length} WAF rules`);
  }

  /**
   * Initialize honeypot traps
   */
  private initializeHoneypots(): void {
    const honeypots = [
      '/admin.php',
      '/wp-admin/',
      '/phpmyadmin/',
      '/administrator/',
      '/config.php',
      '/.env',
      '/backup.sql',
      '/test.php',
      '/shell.php',
      '/c99.php',
    ];

    honeypots.forEach(path => {
      this.honeypotTraps.add(path);
    });

    console.log(`🍯 Initialized ${honeypots.length} honeypot traps`);
  }

  /**
   * Initialize DDoS metrics
   */
  private initializeDDoSMetrics(): void {
    this.ddosMetrics = {
      requestsPerSecond: 0,
      uniqueIPs: 0,
      suspiciousRequests: 0,
      blockedRequests: 0,
      threshold: this.config.ddosThreshold,
      timeWindow: this.config.ddosTimeWindow,
    };
  }

  /**
   * Update DDoS metrics
   */
  private updateDDoSMetrics(): void {
    const now = Date.now();
    const timeWindow = this.config.ddosTimeWindow;
    
    let totalRequests = 0;
    const uniqueIPs = new Set<string>();
    
    for (const [ip, requests] of this.requestHistory.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < timeWindow);
      totalRequests += recentRequests.length;
      
      if (recentRequests.length > 0) {
        uniqueIPs.add(ip);
      }
    }
    
    this.ddosMetrics.requestsPerSecond = totalRequests / (timeWindow / 1000);
    this.ddosMetrics.uniqueIPs = uniqueIPs.size;
  }

  /**
   * Query external threat intelligence
   */
  private async queryExternalThreatDB(ip: string): Promise<void> {
    // Placeholder for external threat intelligence integration
    // In production, integrate with services like VirusTotal, AbuseIPDB, etc.
    
    // Simulate threat intelligence lookup
    const mockThreat: ThreatIntelligence = {
      ip,
      threatLevel: 'low',
      categories: [],
      lastSeen: Date.now(),
      blocked: false,
      reputation: Math.random() * 100,
    };
    
    this.threatIntelligence.set(ip, mockThreat);
  }

  /**
   * Create security incident
   */
  private createSecurityIncident(
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity'],
    source: string,
    details: any
  ): void {
    const incident: SecurityIncident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      type,
      severity,
      source,
      details,
      timestamp: Date.now(),
      resolved: false,
      responseActions: [],
    };

    this.securityIncidents.push(incident);
    
    // Keep only last 1000 incidents
    if (this.securityIncidents.length > 1000) {
      this.securityIncidents = this.securityIncidents.slice(-1000);
    }

    // Log incident
    console.warn(`🚨 Security incident: ${type} from ${source}`, {
      severity,
      details,
      incidentId: incident.id,
    });

    // Trigger alerts for high/critical incidents
    if (severity === 'high' || severity === 'critical') {
      this.triggerSecurityAlert(incident);
    }
  }

  /**
   * Trigger security alert
   */
  private triggerSecurityAlert(incident: SecurityIncident): void {
    // Implement alerting mechanism (email, Slack, PagerDuty, etc.)
    console.error(`🚨 CRITICAL SECURITY ALERT: ${incident.type}`, incident);
  }

  /**
   * Block request
   */
  private blockRequest(res: Response, message: string, statusCode: number): void {
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set advanced security headers
   */
  private setAdvancedSecurityHeaders(res: Response): void {
    // Enhanced security headers
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Content Security Policy with nonce
    const nonce = crypto.randomBytes(16).toString('base64');
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://apis.google.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://us-central1-conference-party-app.cloudfunctions.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '));
  }

  /**
   * Get client IP with proxy support
   */
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] as string ||
           req.ip ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(req: Request, ip: string): void {
    // Update request tracking for rate limiting
    const now = Date.now();
    const requests = this.requestHistory.get(ip) || [];
    requests.push(now);
    this.requestHistory.set(ip, requests);
  }

  /**
   * Start background security tasks
   */
  private startBackgroundTasks(): void {
    // Clean old request history every 5 minutes
    setInterval(() => {
      this.cleanupOldRequests();
    }, 300000);

    // Update threat intelligence every hour
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 3600000);

    // Generate security reports every day
    setInterval(() => {
      this.generateSecurityReport();
    }, 86400000);
  }

  /**
   * Cleanup old request history
   */
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.config.ddosTimeWindow;
    
    for (const [ip, requests] of this.requestHistory.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > cutoff);
      
      if (recentRequests.length === 0) {
        this.requestHistory.delete(ip);
      } else {
        this.requestHistory.set(ip, recentRequests);
      }
    }
  }

  /**
   * Update threat intelligence
   */
  private updateThreatIntelligence(): void {
    // Update threat intelligence from external sources
    console.log('🔍 Updating threat intelligence database...');
  }

  /**
   * Generate security report
   */
  private generateSecurityReport(): void {
    const report = {
      timestamp: Date.now(),
      incidents: this.securityIncidents.length,
      threatIntelligence: this.threatIntelligence.size,
      ddosMetrics: this.ddosMetrics,
      wafRules: this.wafRules.size,
    };

    console.log('📊 Daily security report:', report);
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): any {
    const recentIncidents = this.securityIncidents.filter(
      incident => Date.now() - incident.timestamp < 86400000 // Last 24 hours
    );

    return {
      incidents: {
        total: this.securityIncidents.length,
        last24h: recentIncidents.length,
        byType: this.groupIncidentsByType(recentIncidents),
        bySeverity: this.groupIncidentsBySeverity(recentIncidents),
      },
      ddosMetrics: this.ddosMetrics,
      threatIntelligence: {
        knownThreats: this.threatIntelligence.size,
        blockedIPs: Array.from(this.threatIntelligence.values()).filter(t => t.blocked).length,
      },
      wafRules: {
        total: this.wafRules.size,
        enabled: Array.from(this.wafRules.values()).filter(r => r.enabled).length,
      },
    };
  }

  /**
   * Group incidents by type
   */
  private groupIncidentsByType(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Group incidents by severity
   */
  private groupIncidentsBySeverity(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const advancedSecurity = new AdvancedSecurityModule();