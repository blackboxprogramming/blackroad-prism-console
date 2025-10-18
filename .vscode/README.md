# VS Code Debug Configuration

This directory contains VS Code launch configurations for debugging the BlackRoad Prism Console.

## Available Configurations

### Debug br-ingest-github Worker

Launches the GitHub ingestion worker with a test environment. This configuration:
- Uses the `tsx` loader for TypeScript execution
- Sets up test data directories (`data/prism/` and `data/ssm/`)
- Configures environment variables for the worker
- Enables source maps for proper debugging

**Environment Variables:**
- `SOURCE_ID`: Set to `test-source-1` (matches the test data)
- `PRISM_DATA_DIR`: Points to `${workspaceFolder}/data/prism`
- `SSM_MOCK_DIR`: Points to `${workspaceFolder}/data/ssm`

### Debug Store Functions

Specifically debugs the `store.ts` module with breakpoints. Useful for:
- Testing data persistence functions
- Debugging file I/O operations
- Inspecting JSON serialization/deserialization

## Setup

1. Install dependencies in the worker:
   ```bash
   cd workers/br-ingest-github
   npm install
   ```

2. Create test data (optional, for testing the worker):
   ```bash
   # Create test source
   mkdir -p data/prism
   cat > data/prism/sources.json << 'EOF'
   [
     {
       "id": "test-source-1",
       "kind": "github_pat",
       "status": "connecting",
       "repos": ["blackboxprogramming/blackroad-prism-console"],
       "parameterPath": "/github/test-token",
       "createdAt": "2025-01-01T00:00:00.000Z",
       "updatedAt": "2025-01-01T00:00:00.000Z"
     }
   ]
   EOF
   
   # Create test GitHub token
   mkdir -p data/ssm/github
   echo "ghp_test_token_12345" > data/ssm/github/test-token
   ```

3. Set breakpoints in the code (e.g., in `workers/br-ingest-github/src/store.ts`)

4. Launch the debugger:
   - Press `F5` or use the Run and Debug view
   - Select the desired configuration from the dropdown
   - Click the green play button

## Notes

- The test data directories (`data/prism/` and `data/ssm/`) are ignored by git
- The `tsx` package is required for TypeScript debugging (listed in worker's devDependencies)
- Source maps are automatically enabled for debugging TypeScript files
