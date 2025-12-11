#!/usr/bin/env tsx
/**
 * Phase 9B Verification Harness
 * 
 * Runs automated checks for Phase 9B staging hardening:
 * - Environment variable validation
 * - Build + test execution
 * - Database schema presence checks
 * 
 * Exit codes:
 *   0: PASS (all checks green)
 *   1: FAIL (at least one check failed)
 * 
 * Output: Markdown summary suitable for launch_run doc
 */

import { execSync } from 'node:child_process';
import { Client } from 'pg';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: Record<string, unknown>;
}

const checks: CheckResult[] = [];
let overallFailed = false;

/**
 * Log a check result
 */
function logCheck(check: CheckResult) {
  checks.push(check);
  const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⊘';
  console.log(`[${check.status}] ${check.name}: ${check.message}`);
}

/**
 * Check required environment variables
 */
function checkEnvironment() {
  const required = [
    'SUPABASE_CONNECTION_STRING',
    'STRIPE_SECRET_KEY',
    'FEATURE_MONETIZATION_ENABLED',
  ];

  const missing: string[] = [];
  const present: string[] = [];

  for (const key of required) {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logCheck({
      name: 'Environment Variables',
      status: 'FAIL',
      message: `Missing: ${missing.join(', ')}`,
      details: { present, missing },
    });
    overallFailed = true;
    return;
  }

  // Validate Stripe key format (test mode)
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  if (!stripeKey.startsWith('sk_test_')) {
    logCheck({
      name: 'Environment Variables',
      status: 'FAIL',
      message: `STRIPE_SECRET_KEY does not start with sk_test_ (appears to be live mode!)`,
      details: { stripeKeyPrefix: stripeKey.substring(0, 10) },
    });
    overallFailed = true;
    return;
  }

  logCheck({
    name: 'Environment Variables',
    status: 'PASS',
    message: `All required vars present (${present.length} checked)`,
    details: { present },
  });
}

/**
 * Run npm build
 */
function checkBuild() {
  try {
    console.log('\n[BUILD] Running npm run build...');
    const output = execSync('npm run build 2>&1', { encoding: 'utf-8' });
    
    // Check for success indicators
    if (output.includes('compiled') || output.includes('✓') || !output.includes('error')) {
      logCheck({
        name: 'Build (npm run build)',
        status: 'PASS',
        message: 'Next.js build succeeded',
      });
    } else {
      throw new Error('Build output unclear');
    }
  } catch (err) {
    logCheck({
      name: 'Build (npm run build)',
      status: 'FAIL',
      message: `Build failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    overallFailed = true;
  }
}

/**
 * Run npm test
 */
function checkTests() {
  try {
    console.log('\n[TESTS] Running npm test...');
    const output = execSync('npm test 2>&1', { encoding: 'utf-8' });
    
    // Extract test count from vitest output
    const match = output.match(/Test Files\s+(\d+)\s+\w+[^T]*Tests\s+(\d+)/);
    const testCount = match ? match[2] : 'unknown';
    
    logCheck({
      name: 'Tests (npm test)',
      status: 'PASS',
      message: `Tests passed (${testCount} tests)`,
      details: { testOutput: output.split('\n').slice(-5).join('\n') },
    });
  } catch (err) {
    logCheck({
      name: 'Tests (npm test)',
      status: 'FAIL',
      message: `Tests failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    overallFailed = true;
  }
}

/**
 * Verify database tables exist
 */
async function checkDatabase() {
  const connString = process.env.SUPABASE_CONNECTION_STRING;
  if (!connString) {
    logCheck({
      name: 'Database Schema',
      status: 'SKIP',
      message: 'SUPABASE_CONNECTION_STRING not set, skipping DB checks',
    });
    return;
  }

  const client = new Client({ connectionString: connString });
  
  try {
    console.log('\n[DB] Connecting to Supabase...');
    await client.connect();
    
    const tables = ['payment_audit', 'business_subscription_status'];
    const results: Record<string, boolean> = {};
    let allPresent = true;

    for (const table of tables) {
      const res = await client.query(
        `SELECT to_regclass('public.${table}') IS NOT NULL AS exists;`
      );
      const exists = res.rows[0]?.exists ?? false;
      results[table] = exists;
      
      if (!exists) {
        allPresent = false;
      }
    }

    if (allPresent) {
      logCheck({
        name: 'Database Schema',
        status: 'PASS',
        message: `All required tables present (${tables.join(', ')})`,
        details: results,
      });
    } else {
      logCheck({
        name: 'Database Schema',
        status: 'FAIL',
        message: `Missing tables: ${tables.filter(t => !results[t]).join(', ')}`,
        details: results,
      });
      overallFailed = true;
    }
  } catch (err) {
    logCheck({
      name: 'Database Schema',
      status: 'FAIL',
      message: `Database connection failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    overallFailed = true;
  } finally {
    await client.end();
  }
}

/**
 * Print markdown summary
 */
function printMarkdownSummary() {
  const now = new Date().toISOString();
  const overallStatus = overallFailed ? '❌ AUTOMATION FAILED' : '✅ AUTOMATION PASS';

  console.log('\n\n---\n');
  console.log('## Automated Verification Snapshot – Phase 9B\n');
  console.log(`- **Date:** ${now}`);
  console.log('- **Checks:**');

  for (const check of checks) {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⊘';
    console.log(`  - ${icon} ${check.name}: ${check.message}`);
  }

  console.log(`\n**Overall:** ${overallStatus}`);
  console.log('> Note: Manual Stripe drill (Steps 4.1, 4.3) and production UI checks (Step 7) still required.');
  console.log('> Use `DOCS/automation/PHASE_9B_OPERATOR_CHECKLIST.md` to continue.\n');
}

/**
 * Main entry point
 */
async function main() {
  console.log('========================================');
  console.log('Phase 9B Verification Harness');
  console.log('========================================\n');

  // Run checks in sequence
  checkEnvironment();
  
  if (!overallFailed) {
    checkBuild();
  }
  
  if (!overallFailed) {
    checkTests();
  }

  if (!overallFailed) {
    await checkDatabase();
  }

  printMarkdownSummary();

  // Exit with appropriate code
  process.exit(overallFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
