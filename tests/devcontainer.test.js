/**
 * Tests for GitHub Codespaces / DevContainer configuration
 */

const fs = require('fs');
const path = require('path');

describe('DevContainer Configuration', () => {
  const devcontainerPath = path.join(__dirname, '..', '.devcontainer');
  const devcontainerJsonPath = path.join(devcontainerPath, 'devcontainer.json');
  const postCreateScriptPath = path.join(devcontainerPath, 'post-create.sh');
  const dockerfilePath = path.join(devcontainerPath, 'Dockerfile');
  const readmePath = path.join(devcontainerPath, 'README.md');

  describe('File existence', () => {
    it('should have devcontainer.json', () => {
      expect(fs.existsSync(devcontainerJsonPath)).toBe(true);
    });

    it('should have post-create.sh', () => {
      expect(fs.existsSync(postCreateScriptPath)).toBe(true);
    });

    it('should have Dockerfile', () => {
      expect(fs.existsSync(dockerfilePath)).toBe(true);
    });

    it('should have README.md', () => {
      expect(fs.existsSync(readmePath)).toBe(true);
    });
  });

  describe('devcontainer.json validation', () => {
    let config;

    beforeAll(() => {
      const content = fs.readFileSync(devcontainerJsonPath, 'utf8');
      config = JSON.parse(content);
    });

    it('should be valid JSON', () => {
      expect(config).toBeDefined();
    });

    it('should have a name', () => {
      expect(config.name).toBeDefined();
      expect(typeof config.name).toBe('string');
    });

    it('should reference Dockerfile in build config', () => {
      expect(config.build).toBeDefined();
      expect(config.build.dockerfile).toBe('Dockerfile');
    });

    it('should include Node.js feature', () => {
      expect(config.features).toBeDefined();
      expect(config.features['ghcr.io/devcontainers/features/node:1']).toBeDefined();
      expect(config.features['ghcr.io/devcontainers/features/node:1'].version).toBe('20');
    });

    it('should include Python feature', () => {
      expect(config.features['ghcr.io/devcontainers/features/python:1']).toBeDefined();
      expect(config.features['ghcr.io/devcontainers/features/python:1'].version).toBe('3.11');
    });

    it('should include GitHub CLI feature', () => {
      expect(config.features['ghcr.io/devcontainers/features/github-cli:1']).toBeDefined();
    });

    it('should configure post-create command', () => {
      expect(config.postCreateCommand).toBeDefined();
      expect(config.postCreateCommand).toContain('post-create.sh');
    });

    it('should forward required ports', () => {
      expect(config.forwardPorts).toBeDefined();
      expect(config.forwardPorts).toContain(3000); // Website
      expect(config.forwardPorts).toContain(4000); // Backend API
      expect(config.forwardPorts).toContain(8000); // LLM API
    });

    it('should have port attributes configured', () => {
      expect(config.portsAttributes).toBeDefined();
      expect(config.portsAttributes['3000']).toBeDefined();
      expect(config.portsAttributes['3000'].label).toBe('Website');
      expect(config.portsAttributes['4000']).toBeDefined();
      expect(config.portsAttributes['4000'].label).toBe('Backend API');
      expect(config.portsAttributes['8000']).toBeDefined();
      expect(config.portsAttributes['8000'].label).toBe('LLM API');
    });

    it('should include essential VS Code extensions', () => {
      expect(config.customizations.vscode.extensions).toBeDefined();
      const extensions = config.customizations.vscode.extensions;
      
      // Check for key development extensions
      expect(extensions).toContain('esbenp.prettier-vscode');
      expect(extensions).toContain('dbaeumer.vscode-eslint');
      expect(extensions).toContain('ms-python.python');
      expect(extensions).toContain('ms-python.vscode-pylance');
    });

    it('should configure VS Code settings', () => {
      expect(config.customizations.vscode.settings).toBeDefined();
      expect(config.customizations.vscode.settings['editor.formatOnSave']).toBe(true);
    });

    it('should set remoteUser to vscode', () => {
      expect(config.remoteUser).toBe('vscode');
    });
  });

  describe('post-create.sh validation', () => {
    let scriptContent;

    beforeAll(() => {
      scriptContent = fs.readFileSync(postCreateScriptPath, 'utf8');
    });

    it('should have shebang', () => {
      expect(scriptContent.startsWith('#!/usr/bin/env bash')).toBe(true);
    });

    it('should use strict mode', () => {
      expect(scriptContent).toContain('set -euo pipefail');
    });

    it('should be executable', () => {
      const stats = fs.statSync(postCreateScriptPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      expect(isExecutable).toBe(true);
    });

    it('should install commitlint', () => {
      expect(scriptContent).toContain('commitlint');
      expect(scriptContent).toContain('@commitlint/config-conventional');
    });

    it('should install Python dependencies', () => {
      expect(scriptContent).toContain('pip3 install');
      expect(scriptContent).toContain('requirements.txt');
    });

    it('should install Node.js dependencies', () => {
      expect(scriptContent).toContain('npm install');
    });

    it('should setup pre-commit hooks', () => {
      expect(scriptContent).toContain('pre-commit');
    });

    it('should handle .env creation', () => {
      expect(scriptContent).toContain('.env');
      expect(scriptContent).toContain('.env.example');
    });

    it('should provide helpful output messages', () => {
      expect(scriptContent).toContain('Quick start commands');
      expect(scriptContent).toContain('npm run dev');
      expect(scriptContent).toContain('pytest');
    });
  });

  describe('Dockerfile validation', () => {
    let dockerfileContent;

    beforeAll(() => {
      dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    });

    it('should use devcontainers base image', () => {
      expect(dockerfileContent).toContain('FROM mcr.microsoft.com/devcontainers/base');
    });

    it('should install required packages', () => {
      expect(dockerfileContent).toContain('apt-get');
      expect(dockerfileContent).toContain('python3-pip');
    });
  });

  describe('README.md validation', () => {
    let readmeContent;

    beforeAll(() => {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    });

    it('should have title', () => {
      expect(readmeContent).toContain('# GitHub Codespaces');
    });

    it('should document getting started', () => {
      expect(readmeContent).toContain('Getting Started');
    });

    it('should document port forwarding', () => {
      expect(readmeContent).toContain('Port Forwarding');
      expect(readmeContent).toContain('3000');
      expect(readmeContent).toContain('8000');
    });

    it('should include troubleshooting section', () => {
      expect(readmeContent).toContain('Troubleshooting');
    });

    it('should document quick commands', () => {
      expect(readmeContent).toContain('npm run dev');
      expect(readmeContent).toContain('npm run test');
    });
  });

  describe('Main README integration', () => {
    const mainReadmePath = path.join(__dirname, '..', 'README.md');

    it('should mention Codespaces in main README', () => {
      const content = fs.readFileSync(mainReadmePath, 'utf8');
      expect(content).toContain('Codespaces');
    });

    it('should have Codespaces badge in main README', () => {
      const content = fs.readFileSync(mainReadmePath, 'utf8');
      expect(content).toContain('codespaces.new/blackboxprogramming/blackroad-prism-console');
    });

    it('should link to devcontainer README', () => {
      const content = fs.readFileSync(mainReadmePath, 'utf8');
      expect(content).toContain('.devcontainer/README.md');
    });
  });
});
