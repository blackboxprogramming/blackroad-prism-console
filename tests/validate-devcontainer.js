#!/usr/bin/env node
/**
 * Standalone validation script for DevContainer configuration
 * This runs without external dependencies to validate the setup
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log('✅', description);
    testsPassed++;
  } catch (error) {
    console.log('❌', description);
    console.log('   Error:', error.message);
    testsFailed++;
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toBeDefined() {
      if (value === undefined || value === null) {
        throw new Error('Expected value to be defined');
      }
    },
    toContain(item) {
      if (Array.isArray(value)) {
        if (!value.includes(item)) {
          throw new Error(`Expected array to contain ${item}`);
        }
      } else if (typeof value === 'string') {
        if (!value.includes(item)) {
          throw new Error(`Expected string to contain "${item}"`);
        }
      } else {
        throw new Error('toContain only works with arrays or strings');
      }
    },
    toEqual(expected) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    }
  };
}

console.log('\n🧪 Running DevContainer Configuration Tests\n');

// File paths
const devcontainerPath = path.join(__dirname, '..', '.devcontainer');
const devcontainerJsonPath = path.join(devcontainerPath, 'devcontainer.json');
const postCreateScriptPath = path.join(devcontainerPath, 'post-create.sh');
const dockerfilePath = path.join(devcontainerPath, 'Dockerfile');
const readmePath = path.join(devcontainerPath, 'README.md');
const mainReadmePath = path.join(__dirname, '..', 'README.md');

console.log('📁 File Existence Tests\n');

test('devcontainer.json exists', () => {
  expect(fs.existsSync(devcontainerJsonPath)).toBe(true);
});

test('post-create.sh exists', () => {
  expect(fs.existsSync(postCreateScriptPath)).toBe(true);
});

test('Dockerfile exists', () => {
  expect(fs.existsSync(dockerfilePath)).toBe(true);
});

test('.devcontainer/README.md exists', () => {
  expect(fs.existsSync(readmePath)).toBe(true);
});

console.log('\n🔧 devcontainer.json Validation\n');

let config;
try {
  const content = fs.readFileSync(devcontainerJsonPath, 'utf8');
  config = JSON.parse(content);
  console.log('✅ devcontainer.json is valid JSON');
  testsPassed++;
} catch (error) {
  console.log('❌ devcontainer.json is NOT valid JSON');
  console.log('   Error:', error.message);
  testsFailed++;
  process.exit(1);
}

test('has a name property', () => {
  expect(config.name).toBeDefined();
});

test('references Dockerfile', () => {
  expect(config.build.dockerfile).toBe('Dockerfile');
});

test('includes Node.js 20 feature', () => {
  expect(config.features['ghcr.io/devcontainers/features/node:1'].version).toBe('20');
});

test('includes Python 3.11 feature', () => {
  expect(config.features['ghcr.io/devcontainers/features/python:1'].version).toBe('3.11');
});

test('includes GitHub CLI feature', () => {
  expect(config.features['ghcr.io/devcontainers/features/github-cli:1']).toBeDefined();
});

test('configures post-create command', () => {
  expect(config.postCreateCommand).toContain('post-create.sh');
});

test('forwards port 3000 (Website)', () => {
  expect(config.forwardPorts).toContain(3000);
});

test('forwards port 4000 (Backend API)', () => {
  expect(config.forwardPorts).toContain(4000);
});

test('forwards port 8000 (LLM API)', () => {
  expect(config.forwardPorts).toContain(8000);
});

test('has port 3000 labeled as Website', () => {
  expect(config.portsAttributes['3000'].label).toBe('Website');
});

test('has port 4000 labeled as Backend API', () => {
  expect(config.portsAttributes['4000'].label).toBe('Backend API');
});

test('has port 8000 labeled as LLM API', () => {
  expect(config.portsAttributes['8000'].label).toBe('LLM API');
});

test('includes Prettier extension', () => {
  expect(config.customizations.vscode.extensions).toContain('esbenp.prettier-vscode');
});

test('includes ESLint extension', () => {
  expect(config.customizations.vscode.extensions).toContain('dbaeumer.vscode-eslint');
});

test('includes Python extension', () => {
  expect(config.customizations.vscode.extensions).toContain('ms-python.python');
});

test('includes Pylance extension', () => {
  expect(config.customizations.vscode.extensions).toContain('ms-python.vscode-pylance');
});

test('enables format on save', () => {
  expect(config.customizations.vscode.settings['editor.formatOnSave']).toBe(true);
});

test('sets remoteUser to vscode', () => {
  expect(config.remoteUser).toBe('vscode');
});

console.log('\n📜 post-create.sh Validation\n');

const scriptContent = fs.readFileSync(postCreateScriptPath, 'utf8');

test('has bash shebang', () => {
  expect(scriptContent.startsWith('#!/usr/bin/env bash')).toBe(true);
});

test('uses strict mode (set -euo pipefail)', () => {
  expect(scriptContent).toContain('set -euo pipefail');
});

test('is executable', () => {
  const stats = fs.statSync(postCreateScriptPath);
  const isExecutable = !!(stats.mode & parseInt('111', 8));
  expect(isExecutable).toBe(true);
});

test('installs commitlint', () => {
  expect(scriptContent).toContain('commitlint');
});

test('installs Python dependencies from requirements.txt', () => {
  expect(scriptContent).toContain('requirements.txt');
  expect(scriptContent).toContain('pip3 install');
});

test('installs Node.js dependencies', () => {
  expect(scriptContent).toContain('npm install');
});

test('sets up pre-commit hooks', () => {
  expect(scriptContent).toContain('pre-commit');
});

test('handles .env file creation', () => {
  expect(scriptContent).toContain('.env.example');
});

test('provides quick start commands', () => {
  expect(scriptContent).toContain('Quick start commands');
});

console.log('\n🐳 Dockerfile Validation\n');

const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

test('uses devcontainers base image', () => {
  expect(dockerfileContent).toContain('mcr.microsoft.com/devcontainers/base');
});

test('installs python3-pip', () => {
  expect(dockerfileContent).toContain('python3-pip');
});

console.log('\n📖 README.md Validation\n');

const readmeContent = fs.readFileSync(readmePath, 'utf8');

test('has title', () => {
  expect(readmeContent).toContain('# GitHub Codespaces');
});

test('documents getting started', () => {
  expect(readmeContent).toContain('Getting Started');
});

test('documents port forwarding', () => {
  expect(readmeContent).toContain('Port Forwarding');
});

test('includes troubleshooting section', () => {
  expect(readmeContent).toContain('Troubleshooting');
});

console.log('\n📄 Main README Integration\n');

const mainReadmeContent = fs.readFileSync(mainReadmePath, 'utf8');

test('mentions Codespaces in main README', () => {
  expect(mainReadmeContent).toContain('Codespaces');
});

test('has Codespaces badge', () => {
  expect(mainReadmeContent).toContain('codespaces.new/blackboxprogramming/blackroad-prism-console');
});

test('links to devcontainer README', () => {
  expect(mainReadmeContent).toContain('.devcontainer/README.md');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📝 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(50) + '\n');

if (testsFailed > 0) {
  console.log('❌ Some tests failed. Please review the errors above.\n');
  process.exit(1);
} else {
  console.log('🎉 All tests passed! DevContainer configuration is valid.\n');
  process.exit(0);
}
