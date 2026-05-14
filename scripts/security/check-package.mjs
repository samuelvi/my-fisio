#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  evaluatePackageRisk,
  fetchNpmPackageMetadata,
  fetchOsvVulnerabilities,
  formatRiskReport,
  readDependencyPolicy
} from './dependency-security.mjs';

function printUsage() {
  console.error('Usage: node scripts/security/check-package.mjs <package...>');
  console.error('Usage: node scripts/security/check-package.mjs --lockfile');
}

function runLockfileAudit() {
  execFileSync('pnpm', ['audit', '--audit-level', 'high'], { stdio: 'inherit' });
  console.log('PASS lockfile audit');
}

async function checkPackage(spec, policy) {
  const metadata = await fetchNpmPackageMetadata(spec);
  const vulnerabilities = await fetchOsvVulnerabilities(metadata);
  const result = evaluatePackageRisk({ spec, metadata, vulnerabilities, policy, now: new Date() });
  console.log(formatRiskReport(spec, result));
  return result.status;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
    process.exit(2);
  }

  if (args.length === 1 && args[0] === '--lockfile') {
    runLockfileAudit();
    return;
  }

  const policy = await readDependencyPolicy();
  const statuses = [];

  for (const spec of args) {
    statuses.push(await checkPackage(spec, policy));
  }

  if (statuses.includes('BLOCK') || statuses.includes('REVIEW_REQUIRED')) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
