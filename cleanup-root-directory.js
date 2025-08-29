#!/usr/bin/env node

/**
 * CLEANUP ROOT DIRECTORY
 * Removes debug/test files and organizes the project structure
 */

const fs = require('fs');
const path = require('path');

const filesToDelete = [
  // Delivery fee debug files
  'create-table-programmatically.js',
  'check-and-fix-delivery-fees.js',
  'final-delivery-fee-fix.sql',
  'create-and-disable-delivery-fees.sql',
  'fix-delivery-fees-now.js',
  'fix-delivery-fees-completely.sql',
  'test-delivery-fee-frontend.js',
  'disable-delivery-fees-simple.js',
  'disable-delivery-fees.sql',
  'enable-delivery-fee.js',
  'create-and-disable-delivery-fee.js',
  'disable-delivery-fee.js',
  'FIX_DELIVERY_FEE_TABLE.sql',
  'test-after-sql.js',
  'setup-delivery-fee-table.js',
  'verify-delivery-fee-setup.js',
  'create-delivery-fee-table.sql',
  'test-delivery-fee-toggle.js',
  'setup-delivery-fee-settings.js',
  'create-delivery-fee-settings.sql',

  // Dish-related debug files
  'check-dish-validation.js',
  'diagnose-dish-form.js',
  'test-dish-stats-refresh.js',
  'debug-dish-update-browser.js',
  'test-browser-dish-update.js',
  'test-frontend-dish-update.js',
  'test-dish-update-debug.js',
  'test-dashboard-stats.js',
  'test-stats-refresh.js',
  'test-order-status-updates.js',
  'create-sample-orders.js',
  'verify-orders-display.js',
  'test-multi-restaurant-dish.js',
  'test-edit-dish.js',

  // Admin debug files
  'fix-admin-auth.js',
  'test-admin-login.js',
  'diagnose-admin-auth.js',
  'create-admin-user.js',
  'test-complete-orders-system.js',
  'test-orders-management.js',
  'test-local-admin.js',
  'setup-admin-user.js',
  'test-simple-admin.js',
  'reset-admin-password.js',
  'test-restaurant-creation.js',
  'fix-admin-auth-linking.sql',
  'fix-auth-system.js',
  'check-admin-users.js',
  'test-admin-deletion.js',

  // Database debug files
  'clear-database.sql',
  'clear-database-admin.js',
  'clear-database-tables.js',
  'test-rls-fix.js',
  'diagnose-current-error.js',
  'fix-remote-rls.js',
  'test-restaurant-deletion.js',
  'apply-rls-fix.js',
  'direct-rls-fix.js',
  'diagnose-rls-issue.js',
  'debug-deletion.js',
  'test-final-deletion.js',
  'test-ui-updates.js',
  'monitor-deletions.js',

  // General debug files
  'comprehensive-fix.js',
  'final-verification.js',
  'CURRENT_STATUS.js',
  'create-table-force.js',
  'verify-table-exists.js',
  'FIX_SCHEMA_CACHE.sql',
  'diagnose-table-access.js',
  'check-existing-table.js',
  'test-input-values.js',
  'test-csp-fix.js',
  'verify-config.js',
  'disable-rls-for-dev.sql',
  '.env.development',

  // Documentation files (will be moved to docs/)
  'PWA_FEATURES_README.md',
  'PAYMENT_IN_CART_IMPLEMENTATION.md',
  'SWYCHR_IMPLEMENTATION.md',
  'SWYCHR_PAYMENT_SETUP.md',
  'NETLIFY_DEPLOYMENT.md',
  'TODO.md',
  'HIGH_VOLUME_PAYMENTS.md'
];

const directoriesToCreate = [
  'docs',
  'scripts',
  'config',
  'temp'
];

console.log('🧹 CLEANING UP ROOT DIRECTORY');
console.log('=============================');

// Create necessary directories
console.log('\n📁 Creating directories...');
directoriesToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}/`);
  } else {
    console.log(`⚠️  Exists: ${dir}/`);
  }
});

// Delete debug files
console.log('\n🗑️  Deleting debug files...');
let deletedCount = 0;
let movedCount = 0;

filesToDelete.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (fs.existsSync(filePath)) {
    // Move documentation files to docs/
    if (file.endsWith('.md') && file !== 'README.md') {
      const destPath = path.join(process.cwd(), 'docs', file);
      fs.renameSync(filePath, destPath);
      console.log(`📄 Moved: ${file} → docs/`);
      movedCount++;
    } else {
      // Delete other files
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted: ${file}`);
      deletedCount++;
    }
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

// Create scripts directory and move any remaining scripts
console.log('\n📋 Creating cleanup summary...');

const summary = `# Project Cleanup Summary

## 🗑️ Files Removed (${deletedCount})
Debug, test, and temporary files have been removed to clean up the repository.

## 📄 Documentation Moved (${movedCount})
Documentation files moved to \`docs/\` directory for better organization.

## 📁 New Structure
- \`docs/\` - Documentation files
- \`scripts/\` - Build and deployment scripts
- \`config/\` - Configuration files
- \`temp/\` - Temporary files (gitignored)

## 🎯 Next Steps
1. Update version in package.json
2. Review and update .gitignore
3. Clean up environment files
4. Optimize dependencies
5. Security audit
6. Performance optimization

---
*Cleanup completed on: ${new Date().toISOString()}*
`;

fs.writeFileSync('CLEANUP_SUMMARY.md', summary);

console.log(`\n✅ Cleanup complete!`);
console.log(`📊 Summary saved to: CLEANUP_SUMMARY.md`);
console.log(`\n📈 Results:`);
console.log(`   🗑️  Files deleted: ${deletedCount}`);
console.log(`   📄 Files moved: ${movedCount}`);
console.log(`   📁 Directories created: ${directoriesToCreate.length}`);