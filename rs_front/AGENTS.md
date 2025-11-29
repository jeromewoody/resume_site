# AGENTS.md

**Build/Lint/Test Commands**
- `yarn build` - Production build
- `yarn test --test-file src/components/App.test.js` - Single test execution
- `yarn lint` - Standard ESLint check

**Code Style**
- **Imports**: Relative paths (e.g., `import { Component } from './App'`)
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Error Handling**: Always use `try/catch` for async operations
- **Formatting**: 2-space indentation, no trailing commas
- **File Structure**: Components in `src/components/`, CSS in `src/styles/`
- **Type Safety**: `typeof` checks; no TypeScript
- **Best Practices**: Functions ≤20 lines, max 3 nesting levels

**Notes**
- No cursor rules directory present
- No Copilot configuration files detected