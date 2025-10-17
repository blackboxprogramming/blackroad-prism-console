#!/usr/bin/env node
'use strict';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on', 'enable', 'enabled']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off', 'disable', 'disabled']);
const DEFAULT_ENVIRONMENT = 'development';

function sanitize(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function normalizeEnvironment(value) {
  const sanitized = sanitize(value);
  if (!sanitized) {
    return undefined;
  }
  return sanitized.toLowerCase();
}

function parseDevFlag(value) {
  const sanitized = sanitize(value);
  if (sanitized === undefined) {
    return undefined;
  }
  const normalized = sanitized.toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }
  throw new Error(
    `Unrecognized developer mode flag value "${value}" (expected ${[...TRUE_VALUES,
      ...FALSE_VALUES,
    ].join(', ')})`
  );
}

function selectFlag(flags) {
  const defined = Object.entries(flags).filter(([, value]) => sanitize(value) !== undefined);
  if (defined.length === 0) {
    return { flagName: undefined, enabled: false };
  }
  if (defined.length > 1) {
    const names = defined.map(([name]) => name).join(', ');
    throw new Error(
      `Multiple developer mode flags detected (${names}). Use a single canonical flag.`
    );
  }
  const [flagName, value] = defined[0];
  const enabled = parseDevFlag(value);
  return { flagName, enabled };
}

function assertSafeConfig(options = {}) {
  let appEnv = normalizeEnvironment(options.appEnv);
  const requireAppEnv = Boolean(options.requireAppEnv);
  const missingAppEnv = !appEnv;

  if (missingAppEnv) {
    if (requireAppEnv) {
      throw new Error('APP_ENV must be set to production, staging, development, etc.');
    }
    appEnv = DEFAULT_ENVIRONMENT;
  }
  const { flagName, enabled } = selectFlag({
    DEV_MODE: options.devMode,
    DEVELOPER_MODE: options.developerMode,
  });

  if (appEnv === 'production' && enabled) {
    throw new Error(
      `Developer mode flag ${flagName || 'DEV_MODE'} is enabled while APP_ENV=production`
    );
  }

  return { appEnv, flagName, devModeEnabled: Boolean(enabled), missingAppEnv };
}

function parseArgs(argv) {
  const args = Array.from(argv);
  const result = { quiet: false, requireAppEnv: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case '--app-env':
        result.appEnv = args[++i];
        break;
      case '--dev-mode':
        result.devMode = args[++i];
        break;
      case '--developer-mode':
        result.developerMode = args[++i];
        break;
      case '--require-app-env':
        result.requireAppEnv = true;
        break;
      case '--quiet':
        result.quiet = true;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return result;
}

function printHelp() {
  console.log(`Usage: dev_mode_guard [options]\n\n` +
    'Checks that developer-mode flags are not enabled in production.\n\n' +
    'Options:\n' +
    '  --app-env <value>         Override APP_ENV (defaults to environment variable)\n' +
    '  --dev-mode <value>        Override DEV_MODE\n' +
    '  --developer-mode <value>  Override DEVELOPER_MODE\n' +
    '  --require-app-env         Fail if APP_ENV is not provided\n' +
    '  --quiet                   Suppress success output');
}

function main() {
  try {
    const cli = parseArgs(process.argv.slice(2));
    const result = assertSafeConfig({
      appEnv: cli.appEnv !== undefined ? cli.appEnv : process.env.APP_ENV,
      devMode: cli.devMode !== undefined ? cli.devMode : process.env.DEV_MODE,
      developerMode:
        cli.developerMode !== undefined ? cli.developerMode : process.env.DEVELOPER_MODE,
      requireAppEnv: cli.requireAppEnv,
    });
    if (!cli.quiet) {
      const flagLabel = result.flagName || 'unset';
      console.log(
        `[dev-mode-guard] OK: APP_ENV=${result.appEnv}, flag=${flagLabel}, devModeEnabled=${result.devModeEnabled}`
      );
      if (result.missingAppEnv) {
        console.warn('[dev-mode-guard] warning: APP_ENV was not set; defaulted to development');
      }
    }
  } catch (error) {
    console.error(`[dev-mode-guard] ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  assertSafeConfig,
  parseDevFlag,
  normalizeEnvironment,
  sanitize,
  DEFAULT_ENVIRONMENT,
};
