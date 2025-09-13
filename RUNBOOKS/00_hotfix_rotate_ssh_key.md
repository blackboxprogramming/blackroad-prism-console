# Hotfix: rotate exposed SSH key (critical)

1) **New key on your laptop**  
   ```bash
   ssh-keygen -t ed25519 -C "blackroad-ops-$(date +%Y%m%d)" -f ~/.ssh/blackroad_ops_ed25519
   eval "$(ssh-agent -s)"; ssh-add ~/.ssh/blackroad_ops_ed25519
   pbcopy < ~/.ssh/blackroad_ops_ed25519.pub   # mac; use xclip on linux

2.Revoke the old key on every host

sudo sed -i.bak '/WorkingCopy@iPhone-19082025/d' ~/.ssh/authorized_keys


3.Install the new pubkey on hosts

echo '<PASTE_NEW_PUBKEY_HERE>' | sudo tee -a ~/.ssh/authorized_keys
sudo chmod 600 ~/.ssh/authorized_keys


4.Rotate GitHub keys/tokens (Settings ▸ SSH and GPG keys → delete old; add new)
5.Scan repos for secrets

gitleaks detect --verbose


6.Purge the leaked private key from any repo/log/archive. Treat it as compromised forever.

---
