#!/usr/bin/env node

/**
 * Pre-build script to check if DISABLE_CLERK is set
 * This prevents accidental deployments with Clerk disabled
 */

const hasDisableClerk = process.env.DISABLE_CLERK !== undefined || process.env.NEXT_PUBLIC_DISABLE_CLERK !== undefined;
const isClerkDisabled = process.env.DISABLE_CLERK === 'true' || process.env.NEXT_PUBLIC_DISABLE_CLERK === 'true';

// Only check in build/production contexts
const isBuildContext = process.env.NODE_ENV === 'production' || process.argv.includes('build') || process.env.CI === 'true';

if (isBuildContext && hasDisableClerk) {
  console.error('\n');
  console.error('╔════════════════════════════════════════════════════════════════════════════╗');
  console.error('║                                                                            ║');
  console.error('║                    ❌ BUILD/DEPLOYMENT BLOCKED ❌                        ║');
  console.error('║                                                                            ║');
  console.error('║  DISABLE_CLERK environment variable is detected.                          ║');
  console.error('║  Build/deployment is blocked to prevent deploying without authentication. ║');
  console.error('║                                                                            ║');
  console.error('║  To proceed:                                                                 ║');
  console.error('║    1. Remove DISABLE_CLERK from your environment variables                ║');
  console.error('║    2. Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set correctly         ║');
  console.error('║    3. Re-run the build/deployment                                          ║');
  console.error('║                                                                            ║');
  if (isClerkDisabled) {
    console.error('║  Current value: DISABLE_CLERK=true (Clerk is disabled)                      ║');
  } else {
    console.error('║  Current value: DISABLE_CLERK is set but not "true"                        ║');
  }
  console.error('╚════════════════════════════════════════════════════════════════════════════╝');
  console.error('\n');
  process.exit(1);
}

// If we get here, the check passed
if (isBuildContext) {
  console.log('✓ Clerk environment check passed - DISABLE_CLERK is not set');
}

