const { danger, warn, fail, message, markdown } = require('danger');

// PR Size Check
const bigPRThreshold = 500;
const additions = danger.github.pr.additions;
const deletions = danger.github.pr.deletions;
const fileChanges = additions + deletions;

if (fileChanges > bigPRThreshold) {
  warn(`⚠️ This PR is large (${fileChanges} lines changed). Consider breaking it into smaller PRs for easier review.`);
}

// Check for console.log statements
const jsFiles = danger.git.created_files.concat(danger.git.modified_files)
  .filter(path => path.endsWith('.js') || path.endsWith('.ts'));

jsFiles.forEach(file => {
  const content = danger.github.utils.fileContents(file);
  if (content && content.includes('console.log')) {
    warn(`🔍 Found console.log in ${file}. Remove before merging.`);
  }
});

// Security Checks
const hasSecurityChanges = danger.git.modified_files.some(file => 
  file.includes('auth') || 
  file.includes('security') || 
  file.includes('.env') ||
  file.includes('firestore.rules')
);

if (hasSecurityChanges) {
  message('🔒 This PR contains security-related changes. Please ensure thorough review.');
}

// Test Coverage
const hasTestChanges = danger.git.modified_files.some(file => 
  file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')
);

const hasCodeChanges = danger.git.modified_files.some(file => 
  (file.endsWith('.js') || file.endsWith('.ts')) && 
  !file.includes('.test.') && !file.includes('.spec.')
);

if (hasCodeChanges && !hasTestChanges) {
  warn('⚠️ Code changes detected but no test updates. Consider adding tests.');
}

// Documentation Check
const hasSignificantChanges = fileChanges > 100;
const hasDocChanges = danger.git.modified_files.some(file => 
  file.endsWith('.md') || file === 'CLAUDE.md'
);

if (hasSignificantChanges && !hasDocChanges) {
  warn('📚 Significant changes detected. Consider updating documentation.');
}

// Firebase Functions Specific
const hasFunctionChanges = danger.git.modified_files.some(file => 
  file.startsWith('functions/')
);

if (hasFunctionChanges) {
  message('🔥 Firebase Functions changed. Ensure:\n- Build passes\n- Tests pass\n- API contracts maintained');
}

// PWA/Frontend Specific  
const hasPWAChanges = danger.git.modified_files.some(file => 
  file.startsWith('public/') || file === 'public/sw.js'
);

if (hasPWAChanges) {
  message('📱 PWA changes detected. Ensure:\n- Service worker tested\n- Offline functionality works\n- Mobile responsive');
}

// Performance Impact
const performanceCriticalFiles = [
  'public/sw.js',
  'public/js/cache-utils.js',
  'public/js/offline-search.js',
  'functions/src/index.ts'
];

const hasPerformanceImpact = danger.git.modified_files.some(file => 
  performanceCriticalFiles.includes(file)
);

if (hasPerformanceImpact) {
  warn('⚡ Performance-critical files modified. Please run performance tests.');
}

// Dependencies Check
const packageChanged = danger.git.modified_files.includes('package.json') ||
                      danger.git.modified_files.includes('functions/package.json');

if (packageChanged) {
  message('📦 Dependencies changed. Run `npm audit` to check for vulnerabilities.');
}

// PR Description Check
if (!danger.github.pr.body || danger.github.pr.body.length < 50) {
  fail('📝 Please provide a detailed PR description.');
}

// Check PR Template Usage
const templateSections = [
  'Type of Change',
  'Testing',
  'Code Quality'
];

const prBody = danger.github.pr.body || '';
const missingTemplateSections = templateSections.filter(section => 
  !prBody.includes(section)
);

if (missingTemplateSections.length > 0) {
  warn(`📋 PR template not fully used. Missing sections: ${missingTemplateSections.join(', ')}`);
}

// Positive Feedback
if (fileChanges < 100 && hasTestChanges) {
  message('🎉 Great job! Small PR with tests included.');
}

// Generate Summary
markdown(`
## 📊 PR Analysis Summary

| Metric | Value | Status |
|--------|-------|--------|
| Files Changed | ${danger.github.pr.changed_files} | ${danger.github.pr.changed_files < 10 ? '✅' : '⚠️'} |
| Lines Changed | ${fileChanges} | ${fileChanges < bigPRThreshold ? '✅' : '⚠️'} |
| Has Tests | ${hasTestChanges ? 'Yes' : 'No'} | ${hasTestChanges ? '✅' : '⚠️'} |
| Has Docs | ${hasDocChanges ? 'Yes' : 'No'} | ${hasDocChanges || !hasSignificantChanges ? '✅' : '⚠️'} |

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Documentation updated if needed
`);