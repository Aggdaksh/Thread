#!/usr/bin/env node
'use strict';

/**
 * Phase 0 Baseline Verification Script
 * 
 * NON-INTRUSIVE verification:
 * - Imports files (read-only)
 * - Asserts file existence
 * - Validates env presence
 * - Logs startup readiness
 * 
 * MUST NOT:
 * - Start servers
 * - Modify state
 * - Touch WebSocket logic
 * - Connect to DB
 * - Change runtime flow
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Track verification results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function assert(condition, message, isWarning = false) {
  if (condition) {
    success(message);
    results.passed++;
  } else {
    if (isWarning) {
      warning(message);
      results.warnings++;
    } else {
      error(message);
      results.failed++;
    }
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

// Get backend root directory
const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');

log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
log('Phase 0 Baseline Verification', 'blue');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Entry Point Files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('1. Entry Point Files', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const entryPoints = [
  'server.js',
  'app.js',
  'package.json',
];

entryPoints.forEach(file => {
  const filePath = path.join(backendRoot, file);
  assert(fileExists(filePath), `Entry point exists: ${file}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Configuration Files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n2. Configuration Files', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const configFiles = [
  'config/env.js',
  'config/env.validate.js',
  'config/constants.js',
  'config/db.js',
];

configFiles.forEach(file => {
  const filePath = path.join(backendRoot, file);
  assert(fileExists(filePath), `Config file exists: ${file}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Environment File
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n3. Environment File', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const envExamplePath = path.join(backendRoot, '.env.example');
assert(fileExists(envExamplePath), '.env.example exists');

// Read and validate .env.example structure
if (fileExists(envExamplePath)) {
  try {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'DB_URI',
      'COOKIE_DOMAIN',
      'CORS_ORIGIN',
      'WS_PATH',
    ];
    
    requiredVars.forEach(varName => {
      const hasVar = envExample.includes(`${varName}=`);
      assert(hasVar, `Required env var documented: ${varName}`, false);
    });
  } catch (err) {
    error(`Failed to read .env.example: ${err.message}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Core Directories
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n4. Core Directories', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const coreDirs = [
  { root: backendRoot, dir: 'config', label: 'config/' },
  { root: backendRoot, dir: 'websocket', label: 'websocket/' },
  { root: backendRoot, dir: 'services', label: 'services/' },
  { root: backendRoot, dir: 'utils', label: 'utils/' },
  { root: backendRoot, dir: 'http', label: 'http/' },
  { root: backendRoot, dir: 'models', label: 'models/' },
  { root: projectRoot, dir: 'docs', label: 'docs/' },
];

coreDirs.forEach(({ root, dir, label }) => {
  const dirPath = path.join(root, dir);
  assert(dirExists(dirPath), `Directory exists: ${label}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. WebSocket Structure
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n5. WebSocket Structure', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const wsFiles = [
  'websocket/index.js',
  'websocket/router.js',
  'websocket/connection/wsServer.js',
  'websocket/connection/lifecycle.js',
];

wsFiles.forEach(file => {
  const filePath = path.join(backendRoot, file);
  assert(fileExists(filePath), `WebSocket file exists: ${file}`);
});

const wsStateDir = path.join(backendRoot, 'websocket/state');
assert(dirExists(wsStateDir), 'WebSocket state directory exists: websocket/state/');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Module Importability (Read-Only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n6. Module Importability (Read-Only)', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

// Test that key modules can be imported (read-only, no side effects)
const modulesToTest = [
  { path: path.join(backendRoot, 'config/constants'), name: 'config/constants' },
  { path: path.join(backendRoot, 'utils/logger'), name: 'utils/logger' },
  { path: path.join(backendRoot, 'utils/errorCodes'), name: 'utils/errorCodes' },
];

modulesToTest.forEach(({ path: modulePath, name }) => {
  try {
    const module = require(modulePath);
    assert(module !== null && module !== undefined, `Module importable: ${name}`);
  } catch (err) {
    assert(false, `Module importable: ${name} (${err.message})`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Documentation Files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n7. Documentation Files', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

const docFiles = [
  'env-contract.md',
  'config-map.md',
  'runtime-baseline.md',
  'websocket-baseline.md',
  'folder-contract.md',
];

docFiles.forEach(file => {
  const filePath = path.join(projectRoot, 'docs', file);
  assert(fileExists(filePath), `Documentation exists: docs/${file}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. Environment Variable Validation (Read-Only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n8. Environment Variable Validation (Read-Only)', 'blue');
log('───────────────────────────────────────────────────────────────────────────────', 'blue');

// Check that env validation module exists and can be loaded
try {
  const envValidatePath = path.join(backendRoot, 'config/env.validate');
  const envValidate = require(envValidatePath);
  assert(typeof envValidate === 'function', 'env.validate.js exports validation function');
} catch (err) {
  assert(false, `env.validate.js loadable (${err.message})`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
log('Verification Summary', 'blue');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

log(`Passed:  ${results.passed}`, 'green');
if (results.warnings > 0) {
  log(`Warnings: ${results.warnings}`, 'yellow');
}
if (results.failed > 0) {
  log(`Failed:  ${results.failed}`, 'red');
}

const exitCode = results.failed > 0 ? 1 : 0;

if (exitCode === 0) {
  success('\n✓ Baseline verification PASSED');
  info('All critical files and directories are present.');
  info('Modules are importable (read-only check).');
  info('Documentation is complete.');
} else {
  error('\n✗ Baseline verification FAILED');
  error('Some critical files or checks failed.');
  error('Please review the errors above.');
}

process.exit(exitCode);
