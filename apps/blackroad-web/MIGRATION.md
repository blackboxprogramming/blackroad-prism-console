# Migration from CRA

This project was initialized without Create React App. To migrate an existing CRA codebase:

1. Remove `react-scripts` and related dependencies.
2. Copy source files into `src/` and update environment variables to use the `VITE_` prefix.
3. Replace testing utilities with Vitest and React Testing Library.
4. Verify the strict Content-Security-Policy and TypeScript settings.
