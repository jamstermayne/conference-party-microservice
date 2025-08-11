#!/usr/bin/env node
/**
 * ENTERPRISE DEPLOYMENT MONITORING
 * Real-time deployment health and rollback automation
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');

class DeploymentMonitor {
  constructor() {
    this.healthChecks = {
      api: 'https://us-central1-conference-party-app.cloudfunctions.net/api/health',
      app: 'https://conference-party-app.web.app',
      thresholds: {
        responseTime: 2000, // 2s max
        errorRate: 0.05,    // 5% max error rate
        availability: 0.99   // 99% uptime required
      }
    };
    this.rollbackTrigger = false;
    this.metrics = {
      responseTime: [],
      errors: 0,
      requests: 0,
      startTime: Date.now()
    };
  }

  async monitor(durationMinutes = 10) {
    console.log('🔍 Starting post-deployment monitoring...');
    console.log(`📊 Monitoring for ${durationMinutes} minutes`);
    
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    const interval = 10000; // Check every 10s
    
    while (Date.now() < endTime && !this.rollbackTrigger) {
      await this.performHealthCheck();
      await this.sleep(interval);
    }
    
    return this.generateReport();
  }

  async performHealthCheck() {
    try {
      // API Health Check
      const apiStart = Date.now();
      const apiResponse = await fetch(this.healthChecks.api);
      const apiTime = Date.now() - apiStart;
      
      this.metrics.responseTime.push(apiTime);
      this.metrics.requests++;
      
      if (!apiResponse.ok) {
        this.metrics.errors++;
        console.log(`❌ API health check failed: ${apiResponse.status}`);
      } else {
        console.log(`✅ API healthy: ${apiTime}ms`);
      }
      
      // App Health Check
      const appStart = Date.now();
      const appResponse = await fetch(this.healthChecks.app);
      const appTime = Date.now() - appStart;
      
      if (!appResponse.ok) {
        this.metrics.errors++;
        console.log(`❌ App health check failed: ${appResponse.status}`);
      } else {
        console.log(`✅ App healthy: ${appTime}ms`);
      }
      
      // Check thresholds
      await this.checkThresholds();
      
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Health check error: ${error.message}`);
    }
  }

  async checkThresholds() {
    const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
    const errorRate = this.metrics.errors / this.metrics.requests;
    
    console.log(`📈 Avg Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`📊 Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    
    // Trigger rollback if thresholds exceeded
    if (avgResponseTime > this.healthChecks.thresholds.responseTime) {
      console.log('🚨 CRITICAL: Response time threshold exceeded!');
      this.rollbackTrigger = true;
      return;
    }
    
    if (errorRate > this.healthChecks.thresholds.errorRate) {
      console.log('🚨 CRITICAL: Error rate threshold exceeded!');
      this.rollbackTrigger = true;
      return;
    }
    
    // Alert for warnings
    if (avgResponseTime > this.healthChecks.thresholds.responseTime * 0.8) {
      console.log('⚠️  WARNING: Response time approaching threshold');
    }
  }

  async triggerRollback() {
    console.log('🔄 INITIATING EMERGENCY ROLLBACK...');
    
    try {
      // Get previous commit from Git
      const previousCommit = execSync('git rev-parse HEAD~1').toString().trim();
      console.log(`🔙 Rolling back to commit: ${previousCommit}`);
      
      // Create rollback branch
      execSync(`git checkout -b rollback-${Date.now()}`);
      execSync(`git reset --hard ${previousCommit}`);
      
      // Deploy previous version
      console.log('🚀 Deploying previous version...');
      execSync('npm run deploy', { stdio: 'inherit' });
      
      // Verify rollback
      await this.sleep(30000); // Wait 30s
      const healthCheck = await this.performHealthCheck();
      
      if (!this.rollbackTrigger) {
        console.log('✅ Rollback successful!');
        return true;
      } else {
        console.log('❌ Rollback failed - manual intervention required');
        return false;
      }
      
    } catch (error) {
      console.error('💥 ROLLBACK FAILED:', error.message);
      console.log('🆘 MANUAL INTERVENTION REQUIRED');
      return false;
    }
  }

  generateReport() {
    const duration = (Date.now() - this.metrics.startTime) / 1000;
    const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
    const errorRate = this.metrics.errors / this.metrics.requests;
    const availability = 1 - errorRate;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration)}s`,
      metrics: {
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        averageResponseTime: `${Math.round(avgResponseTime)}ms`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        availability: `${(availability * 100).toFixed(2)}%`
      },
      status: this.rollbackTrigger ? 'FAILED - Rollback triggered' : 'SUCCESS',
      thresholds: this.healthChecks.thresholds
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT MONITORING REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${report.duration}`);
    console.log(`📈 Total Requests: ${report.metrics.totalRequests}`);
    console.log(`❌ Total Errors: ${report.metrics.totalErrors}`);
    console.log(`🚀 Avg Response Time: ${report.metrics.averageResponseTime}`);
    console.log(`📊 Error Rate: ${report.metrics.errorRate}`);
    console.log(`✅ Availability: ${report.metrics.availability}`);
    console.log(`🎯 Status: ${report.status}`);
    console.log('='.repeat(60));
    
    // Save report
    fs.writeFileSync(
      `deployment-report-${Date.now()}.json`, 
      JSON.stringify(report, null, 2)
    );
    
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new DeploymentMonitor();
  const duration = parseInt(process.argv[2]) || 10;
  
  monitor.monitor(duration)
    .then(report => {
      if (report.status.includes('FAILED')) {
        console.log('🚨 Deployment monitoring detected issues!');
        process.exit(1);
      } else {
        console.log('✅ Deployment monitoring completed successfully');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Monitoring failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentMonitor;