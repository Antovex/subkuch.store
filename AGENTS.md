<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:
- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool


<!-- nx configuration end-->

## Workspace quick map

- @subkuch.store/api-gateway (apps/api-gateway)
	- Express app; Webpack build; serves `/api` and static `/assets`
	- Default port: 8080 (via `PORT`)
- @subkuch.store/auth-service (apps/auth-service)
	- Express app; esbuild build; root `GET /` returns a greeting
	- Default host/port: `HOST=localhost`, `PORT=6001`
- @subkuch.store/auth-service-e2e (apps/auth-service-e2e)
	- Jest e2e tests; depends on auth-service build and serve

## Common Nx commands (Windows PowerShell)

- Serve all apps (dev):

	```powershell
	npm run dev
	```

- Serve one app:

	```powershell
	npx nx serve @subkuch.store/api-gateway
	npx nx serve @subkuch.store/auth-service
	```

- Build:

	```powershell
	npx nx build @subkuch.store/api-gateway
	npx nx build @subkuch.store/auth-service
	```

- Test and E2E:

	```powershell
	npx nx test @subkuch.store/auth-service
	npx nx e2e @subkuch.store/auth-service-e2e
	```

- Docker (auth-service):

	```powershell
	npx nx run @subkuch.store/auth-service:docker:build
	npx nx run @subkuch.store/auth-service:docker:run -- -p 3000:3000
	```

## Agent workflow checklist

- Always discover projects and targets with `nx graph` or `nx show project <name>` before making changes
- Prefer `nx` tasks to benefit from caching and dependency tracking
- When adding a new app/service, update `docs/CONTEXT.md` and this file
- Preserve the `nx configuration start/end` comment block above—do not edit within that section
