# GitHub, Local Working Copy, and Droplet Sync

This guide outlines how to keep a GitHub repository, your local working copy, and a remote droplet in sync.

## 1. Connect GitHub to your local working copy
1. **Clone the repository** (or add GitHub as a remote):
   ```bash
   git clone git@github.com:username/repo.git
   cd repo
   # or, in an existing directory
   git init
   git remote add origin git@github.com:username/repo.git
   ```
2. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main  # use your branch name if different
   ```

## 2. Connect your working copy to the droplet
1. **Ensure SSH access** to the droplet and create a bare repository there:
   ```bash
   ssh user@159.65.43.12
   mkdir -p ~/repos/repo.git
   cd ~/repos/repo.git
   git init --bare
   exit
   ```
2. **Add the droplet as a remote** and push:
   ```bash
   git remote add droplet user@159.65.43.12:~/repos/repo.git
   git push droplet main
   ```

## 3. Connect the droplet back to GitHub
1. **Clone from GitHub on the droplet**:
   ```bash
   ssh user@159.65.43.12
   git clone git@github.com:username/repo.git
   cd repo
   ```
2. **Pull, commit, and push as needed**:
   ```bash
   git pull origin main
   git add .
   git commit -m "Commit from droplet"
   git push origin main
   ```

## Notes on security
- Verify the droplet's SSH fingerprint `SHA256:b3uikwBkwnxpMTZjWBFaNgscsWXHRRG3Snj9QYke+ok=` on first connection.
- Use SSH keys instead of passwords whenever possible.

