# Managing Secrets with SOPS & age

We use [sops](https://github.com/getsops/sops) and [age](https://github.com/FiloSottile/age) to encrypt our secret files.  Generate a keypair with `age-keygen` [oai_citation:9‡msound.net](https://msound.net/blog/2023/05/managing-secrets/#:~:text=Keys) and store it in `~/.config/sops/age/keys.txt`.  Encrypt a `.env` file with:

sops -e -a  .env > .env.enc 

Do **not** commit unencrypted files.  The `.sops.yaml` config ensures files ending with `.env.enc` are encrypted via age.  Use `scripts/encrypt_secret.sh` to simplify encryption.
