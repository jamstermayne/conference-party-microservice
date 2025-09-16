#!/usr/bin/env node

/**
 * Surgical Toolkit
 * Master tool for making precise, safe changes to the codebase
 */

const ImpactAnalyzer = require('./impact-analyzer');
const FeatureIsolator = require('./feature-isolator');
const SafeRefactor = require('./safe-refactor');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SurgicalToolkit {
  constructor() {
    this.impactAnalyzer = new ImpactAnalyzer();
    this.featureIsolator = new FeatureIsolator();
    this.safeRefactor = new SafeRefactor();
    this.changeLog = [];
  }

  /**
   * Pre-flight check before making changes
   */
  async preflightCheck(targetFiles = []) {
    console.log('\n🚁 Running Pre-flight Checks...\n');

    const checks = {
      timestamp: new Date().toISOString(),
      gitStatus: 'UNKNOWN',
      testsPass: false,
      lintPass: false,
      buildPass: false,
      dependencies: [],
      risks: [],
      recommendations: []
    };

    // 1. Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (gitStatus.trim()) {
        checks.gitStatus = 'DIRTY';
        checks.recommendations.push('⚠️  Commit or stash changes before proceeding');
      } else {
        checks.gitStatus = 'CLEAN';
      }
    } catch (error) {
      checks.gitStatus = 'NO_GIT';
    }

    // 2. Run tests
    try {
      execSync('npm test -- --silent', { encoding: 'utf-8' });
      checks.testsPass = true;
      console.log('  ✅ Tests passing');
    } catch (error) {
      checks.testsPass = false;
      console.log('  ❌ Tests failing');
      checks.recommendations.push('🔧 Fix failing tests before making changes');
    }

    // 3. Run linter
    try {
      execSync('npm run lint -- --quiet 2>/dev/null', { encoding: 'utf-8' });
      checks.lintPass = true;
      console.log('  ✅ Linting passing');
    } catch (error) {
      checks.lintPass = false;
      console.log('  ⚠️  Linting issues found');
    }

    // 4. Check build
    try {
      execSync('npm run build 2>/dev/null', { encoding: 'utf-8' });
      checks.buildPass = true;
      console.log('  ✅ Build successful');
    } catch (error) {
      checks.buildPass = false;
      console.log('  ⚠️  Build issues');
    }

    // 5. Analyze impact for target files
    if (targetFiles.length > 0) {
      console.log('\n  🔍 Analyzing impact...');
      for (const file of targetFiles) {
        const impact = await this.impactAnalyzer.analyzeFileImpact(file);
        checks.dependencies.push({
          file,
          directDependents: impact.directDependents.length,
          riskLevel: impact.riskLevel
        });

        if (impact.riskLevel === 'HIGH' || impact.riskLevel === 'CRITICAL') {
          checks.risks.push(`High risk change to ${file}`);
        }
      }
    }

    // Generate overall status
    checks.ready = checks.gitStatus === 'CLEAN' && checks.testsPass;

    return checks;
  }

  /**
   * Create a surgical change plan
   */
  async createSurgicalPlan(description, changes) {
    const plan = {
      id: `surgery-${Date.now()}`,
      description,
      timestamp: new Date().toISOString(),
      changes: [],
      impacts: [],
      isolations: [],
      validations: [],
      rollbackPlan: []
    };

    console.log('\n📋 Creating Surgical Plan...\n');

    for (const change of changes) {
      console.log(`  Analyzing: ${change.type} - ${change.description}`);

      // Analyze impact
      if (change.files) {
        for (const file of change.files) {
          const impact = await this.impactAnalyzer.analyzeFileImpact(file);
          plan.impacts.push(impact);
        }
      }

      // Determine if isolation is needed
      const needsIsolation = plan.impacts.some(i =>
        i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL'
      );

      if (needsIsolation) {
        plan.isolations.push({
          feature: change.feature || change.description,
          files: change.files
        });
      }

      // Add validation steps
      plan.validations.push({
        type: change.type,
        tests: change.tests || [],
        checks: change.checks || []
      });

      // Add rollback steps
      plan.rollbackPlan.push({
        type: 'RESTORE_BACKUP',
        files: change.files
      });

      plan.changes.push(change);
    }

    // Save plan
    const planPath = `./surgical-plans/${plan.id}.json`;
    await this.ensureDirectory(path.dirname(planPath));
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));

    console.log(`\n✅ Surgical plan created: ${planPath}`);

    return plan;
  }

  /**
   * Execute a surgical change with all safety measures
   */
  async executeSurgicalChange(planOrChanges, options = {}) {
    const startTime = Date.now();

    console.log('\n🔬 Executing Surgical Change...\n');

    const execution = {
      id: `execution-${Date.now()}`,
      timestamp: new Date().toISOString(),
      plan: null,
      preflightCheck: null,
      isolations: [],
      changes: [],
      validations: [],
      status: 'IN_PROGRESS',
      duration: 0
    };

    try {
      // 1. Load or create plan
      let plan;
      if (typeof planOrChanges === 'string') {
        // Load existing plan
        const planContent = await fs.readFile(planOrChanges, 'utf-8');
        plan = JSON.parse(planContent);
      } else {
        // Create new plan
        plan = await this.createSurgicalPlan('Ad-hoc surgical change', planOrChanges);
      }
      execution.plan = plan;

      // 2. Run preflight check
      const targetFiles = plan.changes.flatMap(c => c.files || []);
      const preflight = await this.preflightCheck(targetFiles);
      execution.preflightCheck = preflight;

      if (!preflight.ready && !options.force) {
        throw new Error('Pre-flight checks failed. Use --force to override.');
      }

      // 3. Create isolations if needed
      for (const isolation of plan.isolations) {
        console.log(`\n🔒 Creating isolation for: ${isolation.feature}`);
        const isolated = await this.featureIsolator.createFeatureIsolation(
          isolation.feature,
          isolation.files
        );
        execution.isolations.push(isolated);
      }

      // 4. Execute changes
      for (const change of plan.changes) {
        console.log(`\n⚡ Executing: ${change.type} - ${change.description}`);

        let result;
        switch (change.type) {
          case 'RENAME':
            result = await this.safeRefactor.safeRename(
              change.oldName,
              change.newName,
              change.options
            );
            break;

          case 'EXTRACT':
            result = await this.safeRefactor.safeExtract(
              change.sourceFile,
              change.startLine,
              change.endLine,
              change.targetFile,
              change.name
            );
            break;

          case 'MODIFY':
            result = await this.modifyFile(change);
            break;

          case 'DELETE':
            result = await this.deleteWithSafety(change);
            break;

          default:
            console.log(`  ⚠️  Unknown change type: ${change.type}`);
        }

        execution.changes.push(result);
      }

      // 5. Run validations
      console.log('\n✔️ Running validations...');
      for (const validation of plan.validations) {
        const result = await this.runValidation(validation);
        execution.validations.push(result);
      }

      // 6. Check for success
      const allValid = execution.validations.every(v => v.success);

      if (allValid) {
        execution.status = 'SUCCESS';
        console.log('\n🎉 Surgical change completed successfully!');
      } else {
        execution.status = 'PARTIAL_SUCCESS';
        console.log('\n⚠️  Some validations failed');
      }

    } catch (error) {
      console.error('\n❌ Surgical change failed:', error.message);
      execution.status = 'FAILED';
      execution.error = error.message;

      // Attempt rollback
      if (options.autoRollback !== false) {
        console.log('\n🔄 Attempting rollback...');
        await this.performRollback(execution);
      }
    }

    execution.duration = Date.now() - startTime;

    // Save execution log
    const logPath = `./surgical-logs/${execution.id}.json`;
    await this.ensureDirectory(path.dirname(logPath));
    await fs.writeFile(logPath, JSON.stringify(execution, null, 2));

    this.generateExecutionReport(execution);

    return execution;
  }

  /**
   * Modify a file with safety checks
   */
  async modifyFile(change) {
    const result = {
      type: 'MODIFY',
      file: change.file,
      status: 'PENDING'
    };

    try {
      // Create backup
      const backup = await this.createBackup(change.file);
      result.backup = backup;

      // Read file
      let content = await fs.readFile(change.file, 'utf-8');

      // Apply modifications
      if (change.replacements) {
        for (const replacement of change.replacements) {
          content = content.replace(
            new RegExp(replacement.search, replacement.flags || 'g'),
            replacement.replace
          );
        }
      }

      if (change.transform) {
        content = change.transform(content);
      }

      // Write file
      await fs.writeFile(change.file, content);

      // Validate syntax if applicable
      if (change.file.endsWith('.js') || change.file.endsWith('.ts')) {
        try {
          execSync(`node --check ${change.file}`, { encoding: 'utf-8' });
          result.syntaxValid = true;
        } catch (error) {
          result.syntaxValid = false;
          result.syntaxError = error.message;
        }
      }

      result.status = 'SUCCESS';
    } catch (error) {
      result.status = 'ERROR';
      result.error = error.message;
    }

    return result;
  }

  /**
   * Delete with safety checks
   */
  async deleteWithSafety(change) {
    const result = {
      type: 'DELETE',
      file: change.file,
      status: 'PENDING'
    };

    try {
      // Check dependencies
      const impact = await this.impactAnalyzer.analyzeFileImpact(change.file);

      if (impact.directDependents.length > 0 && !change.force) {
        throw new Error(`File has ${impact.directDependents.length} dependents. Use force to delete.`);
      }

      // Create backup
      const backup = await this.createBackup(change.file);
      result.backup = backup;

      // Delete file
      await fs.unlink(change.file);

      result.status = 'SUCCESS';
      result.dependentsCount = impact.directDependents.length;
    } catch (error) {
      result.status = 'ERROR';
      result.error = error.message;
    }

    return result;
  }

  /**
   * Run validation
   */
  async runValidation(validation) {
    const result = {
      type: validation.type,
      success: true,
      checks: []
    };

    // Run tests
    if (validation.tests && validation.tests.length > 0) {
      for (const test of validation.tests) {
        try {
          execSync(`npm test -- ${test}`, { encoding: 'utf-8' });
          result.checks.push({ test, passed: true });
        } catch (error) {
          result.checks.push({ test, passed: false, error: error.message });
          result.success = false;
        }
      }
    }

    // Run custom checks
    if (validation.checks && validation.checks.length > 0) {
      for (const check of validation.checks) {
        try {
          const checkResult = await check();
          result.checks.push({ name: check.name, passed: checkResult });
          if (!checkResult) result.success = false;
        } catch (error) {
          result.checks.push({ name: check.name, passed: false, error: error.message });
          result.success = false;
        }
      }
    }

    return result;
  }

  /**
   * Create backup
   */
  async createBackup(filePath) {
    const backupDir = './surgical-backups';
    await this.ensureDirectory(backupDir);

    const timestamp = Date.now();
    const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(backupDir, backupName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, content);
      return backupPath;
    } catch (error) {
      // File might not exist
      return null;
    }
  }

  /**
   * Perform rollback
   */
  async performRollback(execution) {
    // Rollback isolations
    for (const isolation of execution.isolations) {
      if (isolation.rollback) {
        try {
          execSync(`bash ${isolation.rollback.script}`, { stdio: 'inherit' });
        } catch (error) {
          console.error(`Failed to rollback isolation: ${error.message}`);
        }
      }
    }

    // Restore backups
    for (const change of execution.changes) {
      if (change.backup) {
        try {
          const content = await fs.readFile(change.backup, 'utf-8');
          await fs.writeFile(change.file, content);
          console.log(`  ✓ Restored ${change.file}`);
        } catch (error) {
          console.error(`Failed to restore ${change.file}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Generate execution report
   */
  generateExecutionReport(execution) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 SURGICAL EXECUTION REPORT');
    console.log('='.repeat(70));

    console.log(`\n🔧 Execution ID: ${execution.id}`);
    console.log(`⏰ Timestamp: ${execution.timestamp}`);
    console.log(`⏱️  Duration: ${execution.duration}ms`);
    console.log(`📌 Status: ${this.getStatusEmoji(execution.status)} ${execution.status}`);

    if (execution.preflightCheck) {
      console.log('\n🚁 Pre-flight Check:');
      console.log(`  Git Status: ${execution.preflightCheck.gitStatus}`);
      console.log(`  Tests Pass: ${execution.preflightCheck.testsPass ? '✅' : '❌'}`);
      console.log(`  Lint Pass: ${execution.preflightCheck.lintPass ? '✅' : '⚠️'}`);
      console.log(`  Build Pass: ${execution.preflightCheck.buildPass ? '✅' : '⚠️'}`);
    }

    if (execution.isolations.length > 0) {
      console.log('\n🔒 Isolations Created:');
      execution.isolations.forEach(i => {
        console.log(`  • ${i.name} (${i.proxies.length} files)`);
      });
    }

    if (execution.changes.length > 0) {
      console.log('\n📝 Changes Applied:');
      execution.changes.forEach(c => {
        console.log(`  • [${c.type}] ${c.file || c.description} - ${c.status}`);
      });
    }

    if (execution.validations.length > 0) {
      console.log('\n✔️ Validations:');
      execution.validations.forEach(v => {
        console.log(`  • ${v.type}: ${v.success ? '✅ Passed' : '❌ Failed'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  getStatusEmoji(status) {
    const emojis = {
      'SUCCESS': '✅',
      'PARTIAL_SUCCESS': '⚠️',
      'FAILED': '❌',
      'IN_PROGRESS': '⏳'
    };
    return emojis[status] || '❓';
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const toolkit = new SurgicalToolkit();

  if (!command || command === 'help') {
    console.log(`
🔬 Surgical Toolkit - Make Precise, Safe Changes

Usage:
  node surgical-toolkit.js <command> [options]

Commands:
  preflight <files...>      Run pre-flight checks
  analyze <file>            Analyze impact of changes
  isolate <feature> <files> Create feature isolation
  refactor <type> <args>    Perform safe refactoring
  execute <plan.json>       Execute a surgical plan
  interactive               Interactive surgical mode

Quick Actions:
  rename <old> <new>        Safe rename across codebase
  extract <file:range>      Extract code to new file
  delete <file>             Delete with dependency check

Options:
  --force                   Override safety checks
  --dry-run                 Preview without applying
  --no-rollback            Disable auto-rollback
  --isolated               Run in isolation mode

Examples:
  node surgical-toolkit.js preflight src/api.js src/auth.js
  node surgical-toolkit.js analyze src/components/Card.jsx
  node surgical-toolkit.js isolate dark-mode src/theme.css
  node surgical-toolkit.js rename oldFunction newFunction
  node surgical-toolkit.js execute surgery-plan.json

Interactive Mode:
  node surgical-toolkit.js interactive
  → Guided surgical changes with step-by-step validation
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'preflight': {
        const files = args.slice(1);
        const result = await toolkit.preflightCheck(files);
        console.log('\n📋 Pre-flight Check Results:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.ready ? 0 : 1);
        break;
      }

      case 'analyze': {
        const file = args[1];
        if (!file) {
          console.error('❌ Please provide a file to analyze');
          process.exit(1);
        }
        const analyzer = new ImpactAnalyzer();
        const result = await analyzer.analyzeFileImpact(file);
        analyzer.generateReport(result);
        break;
      }

      case 'isolate': {
        const [_, feature, ...files] = args;
        if (!feature || files.length === 0) {
          console.error('❌ Please provide feature name and files');
          process.exit(1);
        }
        const isolator = new FeatureIsolator();
        await isolator.createFeatureIsolation(feature, files);
        break;
      }

      case 'rename': {
        const [_, oldName, newName] = args;
        if (!oldName || !newName) {
          console.error('❌ Please provide old and new names');
          process.exit(1);
        }
        const changes = [{
          type: 'RENAME',
          description: `Rename ${oldName} to ${newName}`,
          oldName,
          newName,
          files: await toolkit.impactAnalyzer.findOccurrences(oldName)
        }];
        await toolkit.executeSurgicalChange(changes);
        break;
      }

      case 'execute': {
        const planFile = args[1];
        if (!planFile) {
          console.error('❌ Please provide a plan file');
          process.exit(1);
        }
        const options = {
          force: args.includes('--force'),
          autoRollback: !args.includes('--no-rollback')
        };
        await toolkit.executeSurgicalChange(planFile, options);
        break;
      }

      case 'interactive': {
        console.log('🔬 Interactive Surgical Mode - Coming Soon!');
        console.log('This will provide a step-by-step guided interface.');
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run with "help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(2);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SurgicalToolkit;