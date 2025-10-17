const path = require('path');
const { spawnSync } = require('child_process');

const {
  assertSafeConfig,
  parseDevFlag,
  normalizeEnvironment,
  DEFAULT_ENVIRONMENT,
} = require('../scripts/security/dev_mode_guard.js');

describe('dev_mode_guard helpers', () => {
  it('normalizes environment names', () => {
    expect(normalizeEnvironment(' Production ')).toBe('production');
    expect(normalizeEnvironment(undefined)).toBeUndefined();
  });

  it('parses dev flags', () => {
    expect(parseDevFlag('true')).toBe(true);
    expect(parseDevFlag('0')).toBe(false);
    expect(() => parseDevFlag('maybe')).toThrow('Unrecognized developer mode flag value');
  });

  it('defaults to development when APP_ENV is absent', () => {
    const result = assertSafeConfig({ devMode: 'false' });
    expect(result.appEnv).toBe(DEFAULT_ENVIRONMENT);
    expect(result.missingAppEnv).toBe(true);
  });

  it('can require APP_ENV explicitly', () => {
    expect(() =>
      assertSafeConfig({ devMode: 'false', requireAppEnv: true })
    ).toThrow('APP_ENV must be set');
  });

  it('rejects developer mode in production', () => {
    expect(() =>
      assertSafeConfig({ appEnv: 'production', devMode: 'true' })
    ).toThrow('Developer mode flag');
  });

  it('allows disabled developer mode in production', () => {
    expect(() =>
      assertSafeConfig({ appEnv: 'production', devMode: 'false' })
    ).not.toThrow();
  });

  it('allows developer mode outside production', () => {
    expect(() =>
      assertSafeConfig({ appEnv: 'staging', devMode: 'true' })
    ).not.toThrow();
  });

  it('rejects multiple developer mode flags', () => {
    expect(() =>
      assertSafeConfig({
        appEnv: 'staging',
        devMode: 'false',
        developerMode: 'true',
      })
    ).toThrow('Multiple developer mode flags');
  });
});

describe('dev_mode_guard cli', () => {
  const script = path.join(__dirname, '../scripts/security/dev_mode_guard.js');

  it('fails when production has developer mode enabled', () => {
    const result = spawnSync('node', [script], {
      env: { ...process.env, APP_ENV: 'production', DEV_MODE: '1' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch('Developer mode flag');
  });

  it('succeeds when developer mode is disabled in production', () => {
    const result = spawnSync('node', [script, '--quiet'], {
      env: { ...process.env, APP_ENV: 'production', DEV_MODE: '0' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('supports overriding values via flags', () => {
    const result = spawnSync(
      'node',
      [script, '--app-env', 'production', '--dev-mode', 'true'],
      {
        env: { ...process.env, APP_ENV: 'development' },
        encoding: 'utf8',
      }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch('Developer mode flag');
  });

  it('fails when APP_ENV is required but missing', () => {
    const env = { ...process.env, DEV_MODE: '0' };
    delete env.APP_ENV;
    const result = spawnSync('node', [script, '--require-app-env'], {
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch('APP_ENV must be set');
  });
});
