import { readFile } from 'node:fs/promises';

export function parsePackageSpec(spec) {
  if (!spec || spec.startsWith('-')) {
    throw new Error(`Invalid package spec: ${spec}`);
  }

  if (spec.startsWith('@')) {
    const secondAt = spec.indexOf('@', 1);
    if (secondAt === -1) {
      return { name: spec, version: null };
    }

    return {
      name: spec.slice(0, secondAt),
      version: spec.slice(secondAt + 1) || null
    };
  }

  const versionSeparator = spec.indexOf('@');
  if (versionSeparator === -1) {
    return { name: spec, version: null };
  }

  return {
    name: spec.slice(0, versionSeparator),
    version: spec.slice(versionSeparator + 1) || null
  };
}

export async function readDependencyPolicy(path = 'config/dependency-policy.json') {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

export function getBlockedSeverity(vulnerability) {
  const databaseSeverity = vulnerability.database_specific?.severity;
  if (typeof databaseSeverity === 'string' && databaseSeverity.length > 0) {
    return databaseSeverity.toUpperCase();
  }

  const severity = vulnerability.severity?.find((entry) => typeof entry.score === 'string');
  if (!severity) {
    return 'UNKNOWN';
  }

  return severity.score.toUpperCase();
}

export function getVersionAgeDays(publishedAt, now) {
  if (!publishedAt) {
    return null;
  }

  const publishedTime = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedTime)) {
    return null;
  }

  const ageMs = now.getTime() - publishedTime;
  return Math.floor(ageMs / 86_400_000);
}

export function evaluatePackageRisk({ spec, metadata, vulnerabilities, policy, now = new Date() }) {
  const { name } = parsePackageSpec(spec);
  const reasons = [];
  let hasReviewSignal = false;

  if (policy.blockedPackages.includes(name)) {
    return { status: 'BLOCK', reasons: [`Package ${name} is blocked by policy.`] };
  }

  if (!metadata) {
    return { status: 'BLOCK', reasons: [`Registry metadata was not found for ${name}.`] };
  }

  if (metadata.deprecated) {
    return { status: 'BLOCK', reasons: [`Package ${name} is deprecated: ${metadata.deprecated}`] };
  }

  for (const vulnerability of vulnerabilities) {
    const severity = getBlockedSeverity(vulnerability);
    if (policy.blockSeverities.includes(severity)) {
      return {
        status: 'BLOCK',
        reasons: [`Vulnerability ${vulnerability.id} has blocked severity ${severity}.`]
      };
    }
  }

  for (const scriptName of policy.reviewLifecycleScripts) {
    if (metadata.scripts?.[scriptName]) {
      reasons.push(`Package ${name} defines lifecycle script ${scriptName}.`);
      hasReviewSignal = true;
    }
  }

  const versionAgeDays = getVersionAgeDays(metadata.publishedAt, now);
  if (versionAgeDays !== null && versionAgeDays < policy.minimumVersionAgeDays) {
    reasons.push(
      `Package ${name}@${metadata.version} is ${versionAgeDays} days old, below the ${policy.minimumVersionAgeDays} day threshold.`
    );
    hasReviewSignal = true;
  }

  if (hasReviewSignal) {
    return { status: 'REVIEW_REQUIRED', reasons };
  }

  return { status: 'PASS', reasons: [] };
}
