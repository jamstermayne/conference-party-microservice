# 🚀 Pull Request

## 📋 Description
<!-- Provide a brief description of the changes in this PR -->

## 🔄 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔒 Security fix
- [ ] 🎨 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test coverage improvement

## 🔗 Related Issues
<!-- Link any related issues here -->
Closes #

## 🧪 Testing
<!-- Describe the tests you ran to verify your changes -->

### 🛡️ Security Testing (Required for UGC changes)
- [ ] Ran `./test-ugc-bulletproof.sh` - **Pass Rate: __/24**
- [ ] Verified input validation works correctly
- [ ] Checked for XSS/injection vulnerabilities
- [ ] Tested error handling scenarios

### ✅ Functionality Testing
- [ ] Manual testing completed
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass
- [ ] PWA functionality works offline
- [ ] Dark mode toggle works correctly

### 📱 Cross-browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

## 🎨 Slack Design System Compliance
<!-- If this PR affects UI components -->
- [ ] Uses Slack-inspired CSS variables (`--slack-color-*`)
- [ ] Maintains consistent spacing (`--slack-spacing-*`)
- [ ] Follows Slack typography patterns
- [ ] Supports both light and dark themes
- [ ] Accessible focus states implemented

## 📸 Screenshots
<!-- Add screenshots here if applicable -->

### Before
<!-- Screenshot of before state -->

### After  
<!-- Screenshot of after state -->

## 🔒 Security Checklist
- [ ] No sensitive data (API keys, passwords, etc.) in the code
- [ ] Input validation implemented where needed
- [ ] Output sanitization applied
- [ ] CORS settings reviewed
- [ ] Authentication/authorization considered
- [ ] Dependencies updated and audited (`npm audit`)

## 🚀 Deployment Checklist
- [ ] Changes tested locally
- [ ] Firebase functions deploy successfully
- [ ] PWA build completes without errors
- [ ] Service worker updates correctly
- [ ] No console errors in production build
- [ ] Performance metrics maintained

## 📝 Additional Notes
<!-- Any additional information, considerations, or context -->

## 🏷️ Reviewer Notes
<!-- Specific areas where you want reviewer attention -->

---

### 🤖 For Reviewers
Please verify:
1. **Security**: Run security tests if UGC-related changes
2. **Design**: Confirm Slack design system compliance  
3. **Functionality**: Test core features work as expected
4. **Performance**: Check for any performance regressions
5. **Accessibility**: Verify keyboard navigation and screen reader support