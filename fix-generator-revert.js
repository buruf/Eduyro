// This reverts generator.ts to use the GitHub version
// Run: node fix-generator-revert.js
const { execSync } = require('child_process');
try {
  execSync('git checkout HEAD -- src/lib/worksheet/generator.ts', { stdio: 'inherit' });
  console.log('✅ generator.ts reverted to GitHub version');
} catch(e) {
  console.log('Git revert failed — manually restore generator.ts from git');
}
