# GitHub Actions → Cloud OIDC Rollout

Short-lived credentials reduce blast radius and eliminate secret sprawl in CI. This guide captures the concrete configuration required to finish migrating BlackRoad Prism Console workflows to OpenID Connect (OIDC) for AWS and Google Cloud Platform (GCP).

## 1. Remove static credentials from source control

- `ops/backup/restic_setup.sh` and `ops/backup/restic.env` now require credentials to be injected at runtime—populate them through your configuration management system or an automated OIDC token exchange.
- A nightly GitHub Actions guard (`no-static-cloud-keys.yml`) blocks merges if AWS access keys, secret keys, or GCP service-account JSON blobs are checked into tracked files.
- After migrating, revoke any previously issued long-lived IAM users or service-account keys.

## 2. AWS: configure GitHub's OIDC provider and role

1. **Create/verify provider**
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
   ```
   Skip if the provider already exists.

2. **Create an IAM role bound to the repository**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
             "token.actions.githubusercontent.com:sub": "repo:BlackRoadOrg/blackroad-prism-console:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

   - Add additional `StringLike` conditions if you need to scope to tags, environments, or workflows: e.g. `"token.actions.githubusercontent.com:sub": "repo:BlackRoadOrg/blackroad-prism-console:environment:Production"`.
   - Grant the role only the IAM permissions required by the workflow (e.g., `AmazonECSFullAccess` is usually too broad—prefer task-, deploy-, or S3-specific policies).
   - Export the ARN as `AWS_ROLE_TO_ASSUME` (or workload-specific secrets such as `PREVIEW_ENV_AWS_ROLE`).

## 3. GCP: Workload Identity Federation

1. **Create a workload identity pool and provider**

   ```bash
   gcloud iam workload-identity-pools create gh-pool \
     --project=<PROJECT_ID> \
     --location="global" \
     --display-name="GitHub Actions"

   gcloud iam workload-identity-pools providers create-oidc gh-provider \
     --project=<PROJECT_ID> \
     --location="global" \
     --workload-identity-pool="gh-pool" \
     --display-name="GitHub Actions" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref"
   ```

2. **Bind a service account to GitHub claims**

   ```bash
   gcloud iam service-accounts add-iam-policy-binding deployer@<PROJECT_ID>.iam.gserviceaccount.com \
     --project=<PROJECT_ID> \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/gh-pool/attribute.repository/BlackRoadOrg/blackroad-prism-console"
   ```

   - Restrict further by including the branch reference: append `/attribute.ref/refs/heads/main` for branch-specific bindings.
   - Grant the service account the minimum Cloud IAM roles (e.g., `roles/run.admin` for Cloud Run deploys).

## 4. Workflow updates

All workflows that touch AWS or GCP must request the `id-token` permission and use federation-aware actions.

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: us-east-1
      - run: aws s3 sync dist s3://my-bucket
```

For GCP:

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/gh-pool/providers/gh-provider
          service_account: deployer@<PROJECT_ID>.iam.gserviceaccount.com
      - run: gcloud run deploy myapp --image=gcr.io/<PROJECT_ID>/app:latest
```

Centralize these snippets in a reusable workflow when multiple repositories target the same role.

## 5. Continuous enforcement

- Keep the `no-static-cloud-keys` workflow enabled; it runs nightly and on demand to detect accidental secrets.
- Enable GitHub secret scanning for the organization and set up notifications for blocked pushes.
- Audit IAM roles quarterly to ensure privilege drift has not reintroduced broad permissions.
