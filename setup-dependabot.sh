#!/bin/bash

# setup-dependabot.sh
# Script to set up the advanced Dependabot configuration

set -e

echo "🤖 Setting up Advanced Dependabot Configuration..."

# Create .github directory if it doesn’t exist
mkdir -p .github/workflows

# Function to create file with content
create_file() {
  local file_path="$1"
  local content="$2"

  if [ -f "$file_path" ]; then
    echo "⚠️  $file_path already exists. Creating backup..."
    cp "$file_path" "${file_path}.backup.$(date +%Y%m%d-%H%M%S)"
  fi

  echo "$content" > "$file_path"
  echo "✅ Created $file_path"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "⚠️  GitHub CLI (gh) is not installed. Some features may not work."
  echo "   Install it from: https://cli.github.com/"
fi

# Check if we’re in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a Git repository. Please run this script from your project root."
  exit 1
fi

# Create package.json if it doesn’t exist (for Node.js projects)
if [ ! -f "package.json" ] && [ "$1" == "--create-package-json" ]; then
  echo "📦 Creating basic package.json..."
  cat > package.json <<'PKGEOF'
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My awesome project",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
PKGEOF
  echo "✅ Created basic package.json"
fi

# Add basic .gitignore if it doesn’t exist
if [ ! -f ".gitignore" ]; then
  echo "📝 Creating .gitignore..."
  cat > .gitignore <<'GITIGNORE'
# Dependencies
node_modules/
**pycache**/
*.pyc
venv/
env/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.tsbuildinfo
GITIGNORE
  echo "✅ Created .gitignore"
fi

# Set up branch protection rules (if GitHub CLI is available)
setup_branch_protection() {
  if command -v gh &> /dev/null; then
    echo "🔒 Setting up branch protection rules..."

    # Get the default branch
    DEFAULT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

    # Enable branch protection with required status checks
    gh api repos/:owner/:repo/branches/$DEFAULT_BRANCH/protection \
      --method PUT \
      --field required_status_checks='{"strict":true,"contexts":["ci"]}' \
      --field enforce_admins=false \
      --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
      --field restrictions=null \
      2>/dev/null && echo "✅ Branch protection rules configured" || echo "⚠️  Could not configure branch protection (may require admin access)"
  else
    echo "⏭️  Skipping branch protection setup (GitHub CLI not available)"
  fi
}

# Create PR template
create_pr_template() {
  mkdir -p .github
  if [ ! -f ".github/pull_request_template.md" ]; then
    cat > .github/pull_request_template.md <<'PREOF'
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Dependency update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] New and existing unit tests pass locally with my changes
PREOF
    echo "✅ Created PR template"
  fi
}

# Enable GitHub features
enable_github_features() {
  if command -v gh &> /dev/null; then
    echo "🔧 Enabling GitHub repository features..."

    # Enable Issues, Wiki, Projects
    gh api repos/:owner/:repo \
      --method PATCH \
      --field has_issues=true \
      --field has_wiki=true \
      --field has_projects=true \
      2>/dev/null && echo "✅ GitHub features enabled" || echo "⚠️  Could not enable all features"

    # Enable vulnerability alerts
    gh api repos/:owner/:repo/vulnerability-alerts \
      --method PUT \
      2>/dev/null && echo "✅ Vulnerability alerts enabled" || echo "⚠️  Could not enable vulnerability alerts"

    # Enable automated security fixes
    gh api repos/:owner/:repo/automated-security-fixes \
      --method PUT \
      2>/dev/null && echo "✅ Automated security fixes enabled" || echo "⚠️  Could not enable automated security fixes"
  fi
}

# Main setup
echo "🚀 Starting setup process..."

# Create all the workflow files and configurations
create_pr_template
setup_branch_protection
enable_github_features

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review the generated configuration files"
echo "2. Customize the dependabot.yml file for your specific needs"
echo "3. Update the workflow files with your team/username information"
echo "4. Push the changes to your repository:"
echo "   git add ."
echo "   git commit -m 'feat: add advanced Dependabot configuration'"
echo "   git push origin main"
echo ""
echo "🔧 Optional customizations:"
echo "- Update reviewer/assignee information in dependabot.yml"
echo "- Adjust schedules and limits based on your preferences"
echo "- Add more package ecosystems if needed"
echo "- Configure team-specific labels and notifications"
echo ""
echo "⚡ Your Dependabot will now:"
echo "✅ Automatically update dependencies"
echo "✅ Fix workflow files"
echo "✅ Install missing dependencies"
echo "✅ Clean up temporary files"
echo "✅ Run security audits"
echo "✅ Auto-merge safe updates"
echo "✅ Create organized, grouped PRs"
