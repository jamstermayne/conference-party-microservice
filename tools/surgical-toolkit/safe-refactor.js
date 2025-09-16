#!/usr/bin/env node

/**
 * Safe Refactoring Tool
 * Performs controlled refactoring with automatic validation and rollback
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SafeRefactor {
  constructor() {
    this.operations = [];
    this.validations = [];
    this.rollbackStack = [];
    this.testResults = new Map();
  }

  /**
   * Rename a variable/function/class across the codebase
   */
  async safeRename(oldName, newName, options = {}) {
    console.log(`\n🔄 Safe Rename: ${oldName} → ${newName}\n`);

    const operation = {
      type: 'RENAME',
      oldName,
      newName,
      timestamp: new Date().toISOString(),
      files: [],
      backups: [],
      validations: [],
      status: 'PENDING'
    };

    try {
      // 1. Find all occurrences
      const occurrences = await this.findOccurrences(oldName, options);
      operation.files = occurrences;

      console.log(`📍 Found ${occurrences.length} files with occurrences`);

      // 2. Create backups
      for (const file of occurrences) {
        const backup = await this.createBackup(file);
        operation.backups.push(backup);
      }

      // 3. Run pre-refactor tests
      const preTests = await this.runTests(options.testPattern);
      operation.preTestResults = preTests;

      // 4. Perform rename with validation
      for (const file of occurrences) {
        await this.performRename(file, oldName, newName, options);
      }

      // 5. Validate changes
      const validation = await this.validateRename(oldName, newName, occurrences);
      operation.validations = validation;

      // 6. Run post-refactor tests
      const postTests = await this.runTests(options.testPattern);
      operation.postTestResults = postTests;

      // 7. Check for regressions
      const regressions = this.detectRegressions(preTests, postTests);

      if (regressions.length > 0) {
        console.log('⚠️  Regressions detected! Rolling back...');
        await this.rollback(operation);
        operation.status = 'ROLLED_BACK';
        operation.regressions = regressions;
      } else {
        operation.status = 'SUCCESS';
        console.log('✅ Rename completed successfully!');
      }

      return operation;
    } catch (error) {
      console.error('❌ Error during refactoring:', error);
      await this.rollback(operation);
      operation.status = 'ERROR';
      operation.error = error.message;
      return operation;
    }
  }

  /**
   * Extract a function or component
   */
  async safeExtract(sourceFile, startLine, endLine, targetFile, name) {
    console.log(`\n📦 Safe Extract: ${name} from ${sourceFile}\n`);

    const operation = {
      type: 'EXTRACT',
      source: sourceFile,
      target: targetFile,
      name,
      lines: { start: startLine, end: endLine },
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    try {
      // 1. Read source file
      const sourceContent = await fs.readFile(sourceFile, 'utf-8');
      const lines = sourceContent.split('\n');

      // 2. Extract content
      const extractedContent = lines.slice(startLine - 1, endLine).join('\n');

      // 3. Analyze dependencies
      const dependencies = await this.analyzeDependencies(extractedContent);

      // 4. Create new component/function
      const newContent = this.createExtractedModule(name, extractedContent, dependencies);

      // 5. Create backup
      const backup = await this.createBackup(sourceFile);
      operation.backup = backup;

      // 6. Write to target file
      if (await this.fileExists(targetFile)) {
        // Append to existing file
        const existingContent = await fs.readFile(targetFile, 'utf-8');
        await fs.writeFile(targetFile, existingContent + '\n\n' + newContent);
      } else {
        // Create new file
        await fs.writeFile(targetFile, newContent);
      }

      // 7. Replace in source with import/reference
      const replacement = this.createImportStatement(targetFile, name);
      lines.splice(startLine - 1, endLine - startLine + 1, replacement);
      await fs.writeFile(sourceFile, lines.join('\n'));

      // 8. Validate extraction
      const validation = await this.validateExtraction(sourceFile, targetFile);

      if (validation.success) {
        operation.status = 'SUCCESS';
        console.log('✅ Extraction completed successfully!');
      } else {
        await this.rollback(operation);
        operation.status = 'VALIDATION_FAILED';
        operation.errors = validation.errors;
      }

      return operation;
    } catch (error) {
      console.error('❌ Error during extraction:', error);
      await this.rollback(operation);
      operation.status = 'ERROR';
      operation.error = error.message;
      return operation;
    }
  }

  /**
   * Inline a variable or function
   */
  async safeInline(targetName, options = {}) {
    console.log(`\n⬇️ Safe Inline: ${targetName}\n`);

    const operation = {
      type: 'INLINE',
      target: targetName,
      timestamp: new Date().toISOString(),
      replacements: [],
      status: 'PENDING'
    };

    try {
      // 1. Find definition
      const definition = await this.findDefinition(targetName);

      if (!definition) {
        throw new Error(`Definition for '${targetName}' not found`);
      }

      // 2. Find all usages
      const usages = await this.findUsages(targetName);

      // 3. Create backups
      const files = [...new Set([definition.file, ...usages.map(u => u.file)])];
      for (const file of files) {
        await this.createBackup(file);
      }

      // 4. Perform inlining
      for (const usage of usages) {
        const replacement = await this.calculateInlineReplacement(
          definition.content,
          usage.context
        );

        await this.replaceInFile(
          usage.file,
          usage.line,
          usage.text,
          replacement
        );

        operation.replacements.push({
          file: usage.file,
          line: usage.line,
          original: usage.text,
          replacement
        });
      }

      // 5. Remove original definition if no longer needed
      if (options.removeOriginal) {
        await this.removeDefinition(definition);
      }

      operation.status = 'SUCCESS';
      console.log(`✅ Inlined ${usages.length} occurrences successfully!`);

      return operation;
    } catch (error) {
      console.error('❌ Error during inlining:', error);
      await this.rollback(operation);
      operation.status = 'ERROR';
      operation.error = error.message;
      return operation;
    }
  }

  /**
   * Change function signature safely
   */
  async safeChangeSignature(functionName, newSignature, options = {}) {
    console.log(`\n✏️ Safe Change Signature: ${functionName}\n`);

    const operation = {
      type: 'CHANGE_SIGNATURE',
      function: functionName,
      newSignature,
      timestamp: new Date().toISOString(),
      updates: [],
      status: 'PENDING'
    };

    try {
      // 1. Find function definition
      const definition = await this.findFunctionDefinition(functionName);

      // 2. Parse old and new signatures
      const oldParams = this.parseParameters(definition.signature);
      const newParams = this.parseParameters(newSignature);

      // 3. Find all call sites
      const callSites = await this.findCallSites(functionName);

      // 4. Create transformation plan
      const plan = this.createSignatureTransformationPlan(oldParams, newParams);

      // 5. Backup all affected files
      const affectedFiles = [definition.file, ...callSites.map(c => c.file)];
      for (const file of [...new Set(affectedFiles)]) {
        await this.createBackup(file);
      }

      // 6. Update function definition
      await this.updateFunctionDefinition(definition, newSignature);

      // 7. Update all call sites
      for (const callSite of callSites) {
        const updatedCall = this.transformCallSite(callSite, plan);
        await this.replaceInFile(
          callSite.file,
          callSite.line,
          callSite.text,
          updatedCall
        );

        operation.updates.push({
          file: callSite.file,
          line: callSite.line,
          original: callSite.text,
          updated: updatedCall
        });
      }

      // 8. Run validation
      const validation = await this.validateSignatureChange(functionName, options);

      if (validation.success) {
        operation.status = 'SUCCESS';
        console.log('✅ Signature change completed successfully!');
      } else {
        await this.rollback(operation);
        operation.status = 'VALIDATION_FAILED';
        operation.errors = validation.errors;
      }

      return operation;
    } catch (error) {
      console.error('❌ Error changing signature:', error);
      await this.rollback(operation);
      operation.status = 'ERROR';
      operation.error = error.message;
      return operation;
    }
  }

  /**
   * Helper: Find occurrences of a name
   */
  async findOccurrences(name, options = {}) {
    const { filePattern = '*', excludeDirs = ['node_modules', '.git'] } = options;

    const excludeArgs = excludeDirs.map(d => `--exclude-dir=${d}`).join(' ');
    const command = `grep -r "\\b${name}\\b" . --include="${filePattern}" ${excludeArgs} -l 2>/dev/null || true`;

    try {
      const result = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return result.split('\n').filter(f => f);
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper: Create backup of a file
   */
  async createBackup(filePath) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content);

    this.rollbackStack.push({
      original: filePath,
      backup: backupPath,
      timestamp: new Date().toISOString()
    });

    return backupPath;
  }

  /**
   * Helper: Perform rename in a file
   */
  async performRename(filePath, oldName, newName, options = {}) {
    const content = await fs.readFile(filePath, 'utf-8');

    // Use word boundaries for accurate replacement
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    const newContent = content.replace(regex, newName);

    if (content !== newContent) {
      await fs.writeFile(filePath, newContent);
      console.log(`  ✓ Updated ${filePath}`);
    }
  }

  /**
   * Helper: Run tests
   */
  async runTests(pattern = '**/*.test.js') {
    try {
      const command = `npm test -- --testPathPattern="${pattern}" --json --silent`;
      const result = execSync(command, { encoding: 'utf-8' });
      const testResults = JSON.parse(result);

      return {
        success: testResults.success,
        numPassedTests: testResults.numPassedTests,
        numFailedTests: testResults.numFailedTests,
        testResults: testResults.testResults
      };
    } catch (error) {
      // Tests failed or no test runner
      return {
        success: false,
        numPassedTests: 0,
        numFailedTests: 0,
        error: error.message
      };
    }
  }

  /**
   * Helper: Detect test regressions
   */
  detectRegressions(preTests, postTests) {
    const regressions = [];

    if (postTests.numFailedTests > preTests.numFailedTests) {
      regressions.push({
        type: 'NEW_TEST_FAILURES',
        count: postTests.numFailedTests - preTests.numFailedTests
      });
    }

    if (postTests.numPassedTests < preTests.numPassedTests) {
      regressions.push({
        type: 'TESTS_NOW_FAILING',
        count: preTests.numPassedTests - postTests.numPassedTests
      });
    }

    return regressions;
  }

  /**
   * Helper: Rollback operation
   */
  async rollback(operation) {
    console.log('\n🔄 Rolling back changes...');

    // Restore backups in reverse order
    while (this.rollbackStack.length > 0) {
      const { original, backup } = this.rollbackStack.pop();
      const backupContent = await fs.readFile(backup, 'utf-8');
      await fs.writeFile(original, backupContent);
      await fs.unlink(backup); // Remove backup file
      console.log(`  ✓ Restored ${original}`);
    }

    console.log('✅ Rollback complete');
  }

  /**
   * Helper: Validate rename operation
   */
  async validateRename(oldName, newName, files) {
    const validations = [];

    // Check that old name no longer exists
    const remainingOld = await this.findOccurrences(oldName);
    if (remainingOld.length > 0) {
      validations.push({
        type: 'WARNING',
        message: `Found ${remainingOld.length} remaining occurrences of '${oldName}'`
      });
    }

    // Check that new name exists
    const foundNew = await this.findOccurrences(newName);
    if (foundNew.length === 0) {
      validations.push({
        type: 'ERROR',
        message: `No occurrences of new name '${newName}' found`
      });
    }

    // Check syntax errors
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          execSync(`node --check ${file} 2>&1`, { encoding: 'utf-8' });
        } catch (error) {
          validations.push({
            type: 'ERROR',
            message: `Syntax error in ${file}: ${error.message}`
          });
        }
      }
    }

    return validations;
  }

  /**
   * Helper: Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate refactoring report
   */
  generateReport(operation) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REFACTORING REPORT');
    console.log('='.repeat(60));

    console.log(`\n🔧 Operation: ${operation.type}`);
    console.log(`⏰ Timestamp: ${operation.timestamp}`);
    console.log(`📌 Status: ${this.getStatusEmoji(operation.status)} ${operation.status}`);

    if (operation.type === 'RENAME') {
      console.log(`\n📝 Rename Details:`);
      console.log(`  Old Name: ${operation.oldName}`);
      console.log(`  New Name: ${operation.newName}`);
      console.log(`  Files Modified: ${operation.files.length}`);
    }

    if (operation.validations && operation.validations.length > 0) {
      console.log('\n⚠️  Validations:');
      operation.validations.forEach(v => {
        console.log(`  [${v.type}] ${v.message}`);
      });
    }

    if (operation.regressions && operation.regressions.length > 0) {
      console.log('\n🚨 Regressions Detected:');
      operation.regressions.forEach(r => {
        console.log(`  • ${r.type}: ${r.count}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  getStatusEmoji(status) {
    const emojis = {
      'SUCCESS': '✅',
      'PENDING': '⏳',
      'ERROR': '❌',
      'ROLLED_BACK': '🔄',
      'VALIDATION_FAILED': '⚠️'
    };
    return emojis[status] || '❓';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const refactor = new SafeRefactor();

  if (!command || command === 'help') {
    console.log(`
🛡️ Safe Refactor Tool

Usage:
  node safe-refactor.js <command> [options]

Commands:
  rename <old> <new> [options]       Rename across codebase
  extract <file:start:end> <target>  Extract code to new file
  inline <name>                      Inline variable/function
  signature <func> <new-sig>         Change function signature

Options:
  --test-pattern <pattern>  Test files to run for validation
  --file-pattern <pattern>  File pattern to search
  --exclude <dirs>          Directories to exclude
  --dry-run                 Preview changes without applying

Examples:
  node safe-refactor.js rename oldFunction newFunction
  node safe-refactor.js extract src/app.js:10:50 src/utils/helper.js
  node safe-refactor.js inline CONSTANT_VALUE
  node safe-refactor.js signature doWork "async doWork(data, options = {})"
    `);
    process.exit(0);
  }

  try {
    let result;

    switch (command) {
      case 'rename': {
        const [_, oldName, newName, ...options] = args;
        if (!oldName || !newName) {
          console.error('❌ Please provide old and new names');
          process.exit(1);
        }
        result = await refactor.safeRename(oldName, newName, { testPattern: options[0] });
        break;
      }

      case 'extract': {
        const [_, source, target] = args;
        if (!source || !target) {
          console.error('❌ Please provide source (file:start:end) and target');
          process.exit(1);
        }
        const [file, start, end] = source.split(':');
        const name = path.basename(target, path.extname(target));
        result = await refactor.safeExtract(file, parseInt(start), parseInt(end), target, name);
        break;
      }

      case 'inline': {
        const [_, name] = args;
        if (!name) {
          console.error('❌ Please provide name to inline');
          process.exit(1);
        }
        result = await refactor.safeInline(name);
        break;
      }

      case 'signature': {
        const [_, func, ...sigParts] = args;
        const newSig = sigParts.join(' ');
        if (!func || !newSig) {
          console.error('❌ Please provide function name and new signature');
          process.exit(1);
        }
        result = await refactor.safeChangeSignature(func, newSig);
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

    refactor.generateReport(result);

    // Exit with appropriate code
    process.exit(result.status === 'SUCCESS' ? 0 : 1);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(2);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SafeRefactor;