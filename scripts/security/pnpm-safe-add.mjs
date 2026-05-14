#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  evaluatePackageRisk,
  fetchNpmPackageMetadata,
  fetchOsvVulnerabilities,
  formatRiskReport,
  normalizeCliArgs,
  readDependencyPolicy
} from './dependency-security.mjs';

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function assertPnpmScriptBlocking() {
  const ignoreScripts = run('pnpm', ['config', 'get', 'ignoreScripts']);
  if (ignoreScripts !== 'true') {
    throw new Error(`Refusing to add dependencies: pnpm ignoreScripts must be true, got ${ignoreScripts}.`);
  }
}

function parseArgs(args) {
  const normalizedArgs = normalizeCliArgs(args);
  const saveDev = normalizedArgs.includes('--save-dev');
  const packageSpecs = normalizedArgs.filter((arg) => arg !== '--save-dev' && arg !== '--save-prod');

  if (packageSpecs.length === 0) {
    throw new Error('Usage: node scripts/security/pnpm-safe-add.mjs [--save-dev] <package...>');
  }

  return { saveDev, packageSpecs };
}

async function checkPackage(spec, policy) {
  const metadata = await fetchNpmPackageMetadata(spec);
  const vulnerabilities = await fetchOsvVulnerabilities(metadata);
  const result = evaluatePackageRisk({ spec, metadata, vulnerabilities, policy, now: new Date() });
  console.log(formatRiskReport(spec, result));
  return result.status;
}

async function main() {
  const { saveDev, packageSpecs } = parseArgs(process.argv.slice(2));
  assertPnpmScriptBlocking();

  const policy = await readDependencyPolicy();
  const statuses = [];
  for (const spec of packageSpecs) {
    statuses.push(await checkPackage(spec, policy));
  }

  if (statuses.includes('BLOCK') || statuses.includes('REVIEW_REQUIRED')) {
    throw new Error('Dependency installation blocked. Review the report above.');
  }

  const addArgs = ['add', '--ignore-scripts'];
  if (saveDev) {
    addArgs.push('-D');
  }
  addArgs.push(...packageSpecs);

  execFileSync('pnpm', addArgs, { stdio: 'inherit' });
  execFileSync('pnpm', ['audit', '--audit-level', 'high'], { stdio: 'inherit' });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
