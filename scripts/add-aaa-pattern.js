#!/usr/bin/env node

/**
 * Script to add AAA (Arrange-Act-Assert) pattern comments to test files
 * This helps ensure all tests follow the AAA pattern as required by the test plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all test files
function findTestFiles(dir) {
  const testFiles = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      testFiles.push(...findTestFiles(fullPath));
    } else if (file.name.endsWith('.test.ts')) {
      testFiles.push(fullPath);
    }
  }
  
  return testFiles;
}

// Check if a test case already has AAA comments
function hasAAAPattern(content, testStartIndex) {
  const nextLines = content.slice(testStartIndex, testStartIndex + 20);
  return nextLines.includes('// Arrange') || 
         nextLines.includes('// Act') || 
         nextLines.includes('// Assert');
}

// Add AAA pattern to a test case
function addAAAPatternToTest(content, testMatch) {
  const testStart = testMatch.index;
  const testBodyStart = testMatch.index + testMatch[0].length;
  
  // Check if already has AAA pattern
  if (hasAAAPattern(content, testBodyStart)) {
    return content;
  }
  
  // Find the first non-empty line after the test declaration
  let currentIndex = testBodyStart;
  let braceCount = 0;
  let firstStatementIndex = -1;
  let inString = false;
  let stringChar = null;
  
  // Skip whitespace and find first actual statement
  while (currentIndex < content.length) {
    const char = content[currentIndex];
    
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && content[currentIndex - 1] !== '\\') {
      inString = false;
      stringChar = null;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      
      // Found first statement (non-whitespace, non-comment)
      if (braceCount > 0 && firstStatementIndex === -1 && 
          !content.slice(currentIndex, currentIndex + 2).match(/^\s*\/\//) &&
          content[currentIndex].match(/\S/)) {
        firstStatementIndex = currentIndex;
        break;
      }
    }
    
    currentIndex++;
  }
  
  if (firstStatementIndex === -1) {
    return content; // Couldn't find insertion point
  }
  
  // Check if first statement is already a comment
  const firstLine = content.slice(firstStatementIndex, content.indexOf('\n', firstStatementIndex));
  if (firstLine.trim().startsWith('//')) {
    return content; // Already has comments
  }
  
  // Insert AAA comments before first statement
  const beforeFirst = content.slice(0, firstStatementIndex);
  const afterFirst = content.slice(firstStatementIndex);
  
  // Determine if we need Arrange section
  const needsArrange = !beforeFirst.includes('// Arrange');
  
  let insertText = '';
  if (needsArrange) {
    insertText = '      // Arrange\n';
  }
  
  // Find where Act should be (before the main function call)
  const actMatch = afterFirst.match(/(\s+)(const\s+result\s*=\s*await|await\s+\w+\.|const\s+\w+\s*=\s*await|expect\(|await\s+expect\()/);
  if (actMatch) {
    const actIndex = firstStatementIndex + actMatch.index;
    const beforeAct = content.slice(0, actIndex);
    const actLineStart = content.lastIndexOf('\n', actIndex) + 1;
    const indent = content.slice(actLineStart, actIndex);
    
    // Insert Act comment
    const newContent = beforeAct + indent + '// Act\n' + content.slice(actIndex);
    
    // Find Assert section (first expect)
    const assertMatch = newContent.slice(actIndex + indent.length + 6).match(/(\s+)expect\(/);
    if (assertMatch) {
      const assertIndex = actIndex + indent.length + 6 + assertMatch.index;
      const assertLineStart = newContent.lastIndexOf('\n', assertIndex) + 1;
      const assertIndent = newContent.slice(assertLineStart, assertIndex);
      
      return newContent.slice(0, assertIndex) + assertIndent + '// Assert\n' + newContent.slice(assertIndex);
    }
    
    return newContent;
  }
  
  return content;
}

// Process a single test file
function processTestFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Match test cases: it("description", async () => { ... })
  const testRegex = /it\(["'`]([^"'`]+)["'`],\s*async\s*\(\)\s*=>\s*\{/g;
  let match;
  let modified = false;
  
  while ((match = testRegex.exec(content)) !== null) {
    const beforeMatch = content.slice(0, match.index);
    const afterMatch = content.slice(match.index);
    
    // Skip if already has AAA pattern
    if (hasAAAPattern(afterMatch, 0)) {
      continue;
    }
    
    // Simple heuristic: if test has multiple statements, add AAA
    const testBody = afterMatch.match(/\{([\s\S]*?)\n\s+\}\);/);
    if (testBody && testBody[1].split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length > 2) {
      const newContent = addAAAPatternToTest(content, match);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        // Reset regex to continue from beginning
        testRegex.lastIndex = 0;
      }
    }
  }
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Updated ${filePath}`);
    return true;
  } else {
    console.log(`  - No changes needed for ${filePath}`);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const testFiles = findTestFiles(srcDir);
  
  console.log(`Found ${testFiles.length} test files\n`);
  
  let updatedCount = 0;
  for (const file of testFiles) {
    if (processTestFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✓ Updated ${updatedCount} out of ${testFiles.length} test files`);
}

if (require.main === module) {
  main();
}

module.exports = { processTestFile, findTestFiles };
