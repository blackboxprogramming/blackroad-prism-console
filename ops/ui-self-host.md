# UI Self-Host Runbook

1. Build the Docker image:
   ```bash
   docker build -t blackroad-web apps/blackroad-web
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 blackroad-web
   ```
3. Access the UI at `http://localhost:3000`.
