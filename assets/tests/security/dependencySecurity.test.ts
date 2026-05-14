import { describe, expect, it } from 'vitest';

type RegistryMetadata = {
  name: string;
  deprecated?: string;
  version: string;
  publishedAt?: string;
  scripts?: Record<string, string>;
};

type OsvVulnerability = {
  id: string;
  summary?: string;
  severity?: Array<{ type: string; score: string }>;
  database_specific?: { severity?: string };
};

type Policy = {
  blockSeverities: string[];
  reviewLifecycleScripts: string[];
  minimumVersionAgeDays: number;
  allowedPackages: string[];
  blockedPackages: string[];
};

const policy: Policy = {
  blockSeverities: ['HIGH', 'CRITICAL'],
  reviewLifecycleScripts: ['preinstall', 'install', 'postinstall', 'prepare'],
  minimumVersionAgeDays: 7,
  allowedPackages: [],
  blockedPackages: []
};

const now = new Date('2026-05-14T10:00:00.000Z');

async function loadModule() {
  return import('../../../scripts/security/dependency-security.mjs') as Promise<{
    evaluatePackageRisk: (input: {
      spec: string;
      metadata: RegistryMetadata | null;
      vulnerabilities: OsvVulnerability[];
      policy: Policy;
      now: Date;
    }) => {
      status: 'PASS' | 'BLOCK' | 'REVIEW_REQUIRED';
      reasons: string[];
    };
    parsePackageSpec: (spec: string) => { name: string; version: string | null };
  }>;
}

describe('dependency security evaluation', () => {
  it('parses scoped package specs with versions', async () => {
    const { parsePackageSpec } = await loadModule();

    expect(parsePackageSpec('@scope/name@1.2.3')).toEqual({
      name: '@scope/name',
      version: '1.2.3'
    });
  });

  it('blocks packages that are explicitly denied by policy', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'left-pad',
      metadata: { name: 'left-pad', version: '1.3.0', publishedAt: '2024-01-01T00:00:00.000Z' },
      vulnerabilities: [],
      policy: { ...policy, blockedPackages: ['left-pad'] },
      now
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reasons).toContain('Package left-pad is blocked by policy.');
  });

  it('blocks packages with missing registry metadata', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'missing-package',
      metadata: null,
      vulnerabilities: [],
      policy,
      now
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reasons).toContain('Registry metadata was not found for missing-package.');
  });

  it('blocks deprecated packages', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'deprecated-package',
      metadata: {
        name: 'deprecated-package',
        version: '1.0.0',
        deprecated: 'Use maintained-package instead.',
        publishedAt: '2024-01-01T00:00:00.000Z'
      },
      vulnerabilities: [],
      policy,
      now
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reasons).toContain('Package deprecated-package is deprecated: Use maintained-package instead.');
  });

  it('blocks high severity OSV vulnerabilities', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'risky-package',
      metadata: { name: 'risky-package', version: '2.0.0', publishedAt: '2024-01-01T00:00:00.000Z' },
      vulnerabilities: [{ id: 'GHSA-1234', database_specific: { severity: 'HIGH' } }],
      policy,
      now
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reasons).toContain('Vulnerability GHSA-1234 has blocked severity HIGH.');
  });

  it('requires review for lifecycle scripts', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'scripted-package',
      metadata: {
        name: 'scripted-package',
        version: '1.0.0',
        publishedAt: '2024-01-01T00:00:00.000Z',
        scripts: { postinstall: 'node install.js' }
      },
      vulnerabilities: [],
      policy,
      now
    });

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.reasons).toContain('Package scripted-package defines lifecycle script postinstall.');
  });

  it('requires review for versions younger than the policy threshold', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'fresh-package',
      metadata: { name: 'fresh-package', version: '1.0.0', publishedAt: '2026-05-12T10:00:00.000Z' },
      vulnerabilities: [],
      policy,
      now
    });

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.reasons).toContain('Package fresh-package@1.0.0 is 2 days old, below the 7 day threshold.');
  });

  it('passes old packages without blocked risk signals', async () => {
    const { evaluatePackageRisk } = await loadModule();

    const result = evaluatePackageRisk({
      spec: 'safe-package',
      metadata: { name: 'safe-package', version: '1.0.0', publishedAt: '2024-01-01T00:00:00.000Z' },
      vulnerabilities: [],
      policy,
      now
    });

    expect(result).toEqual({ status: 'PASS', reasons: [] });
  });
});
