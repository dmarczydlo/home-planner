#!/usr/bin/env node

/**
 * Script to check for hardcoded color usage that should use theme colors instead
 * Run with: node scripts/check-colors.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const FORBIDDEN_PATTERNS = [
  // Gray colors
  /text-gray-\d+/g,
  /bg-gray-\d+/g,
  /border-gray-\d+/g,
  // White/black hardcoded
  /bg-white\b/g,
  /bg-black\b/g,
  /text-white\b/g,
  /text-black\b/g,
  // Dark mode color variants (theme handles this)
  /dark:text-gray-\d+/g,
  /dark:bg-gray-\d+/g,
  /dark:border-gray-\d+/g,
  /dark:bg-white/g,
  /dark:text-white/g,
  // Hardcoded hex/rgb (basic check)
  /#[0-9a-fA-F]{3,6}\b/g,
  /rgb\(/g,
  /rgba\(/g,
];

const ALLOWED_PATTERNS = [
  // These are OK - they're theme colors
  /text-foreground/g,
  /text-muted-foreground/g,
  /bg-background/g,
  /bg-card/g,
  /border-border/g,
  /border-primary/g,
  /text-primary/g,
  /bg-primary/g,
  // Utility classes are OK
  /glass-effect/g,
  /form-input/g,
  /card-modern/g,
];

function shouldIgnoreFile(filePath) {
  const ignoreDirs = ['node_modules', '.git', '.astro', 'dist', 'build', 'coverage'];
  const ignoreFiles = ['.d.ts', '.test.', '.spec.'];
  
  return ignoreDirs.some(dir => filePath.includes(dir)) ||
         ignoreFiles.some(pattern => filePath.includes(pattern));
}

function checkFile(filePath) {
  if (shouldIgnoreFile(filePath)) return [];
  
  const ext = extname(filePath);
  if (!['.tsx', '.ts', '.astro', '.css'].includes(ext)) return [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      FORBIDDEN_PATTERNS.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          // Check if it's in an allowed context (comments, strings that are not className)
          const isInComment = line.trim().startsWith('//') || line.includes('/*');
          const isInAllowedContext = ALLOWED_PATTERNS.some(allowed => line.includes(allowed));
          
          if (!isInComment && !isInAllowedContext) {
            matches.forEach(match => {
              issues.push({
                file: filePath,
                line: index + 1,
                match,
                context: line.trim().substring(0, 80),
              });
            });
          }
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir, allIssues = []) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    if (shouldIgnoreFile(fullPath)) continue;
    
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath, allIssues);
      } else {
        const issues = checkFile(fullPath);
        allIssues.push(...issues);
      }
    } catch (error) {
      // Skip files we can't read
    }
  }
  
  return allIssues;
}

// Main execution
const srcDir = join(process.cwd(), 'src');
console.log('🔍 Scanning for hardcoded colors...\n');

const issues = scanDirectory(srcDir);

if (issues.length === 0) {
  console.log('✅ No hardcoded colors found! All components use theme colors.');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${issues.length} potential hardcoded color usage(s):\n`);
  
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});
  
  Object.entries(grouped).forEach(([file, fileIssues]) => {
    console.log(`📄 ${file}`);
    fileIssues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.match}`);
      console.log(`   ${issue.context}`);
    });
    console.log();
  });
  
  console.log('💡 Tip: Use theme colors (text-foreground, bg-card, etc.) or utility classes instead.');
  console.log('   See STYLING_GUIDE.md for reference.\n');
  
  process.exit(1);
}
