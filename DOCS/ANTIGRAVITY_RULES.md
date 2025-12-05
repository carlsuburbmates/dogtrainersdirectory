# Antigravity Operational Rules & MCP Guidelines

## 🧠 Core Philosophy
1.  **Context First:** Before writing code, always verify the current state using available MCP tools.
2.  **Verify, Don't Guess:** Use Supabase and GitHub MCPs to validate assumptions about database schemas and repository state.
3.  **Atomic Changes:** Make small, verifiable changes rather than large, sweeping refactors.

## 🔌 MCP Server Utilization Model

### 1. Database & Backend (Supabase MCP)
-   **Trigger:** Whenever modifying `schema.prisma`, SQL migrations, or TypeScript interfaces in `src/types/database.ts`.
-   **Action:**
    -   Use `supabase` server to inspect live table definitions (`get_table_info`).
    -   Verify row level security (RLS) policies before deploying changes.
    -   NEVER hardcode types without checking the live database schema first.

### 2. Version Control & Ops (GitHub MCP)
-   **Trigger:** Creating PRs, checking CI/CD status, or analyzing file history.
-   **Action:**
    -   Use `github` server to search for existing issues before flagging "new" bugs.
    - Draft PR descriptions automatically using context from changed files.

### 3. Payments & Billing (Stripe MCP)
-   **Trigger:** Working on checkout flows, subscription logic, or webhooks (`src/app/api/webhooks/stripe`).
-   **Action:**
    -   Use `mcp_list_products` and `mcp_list_prices` to verify IDs matching code constants.
    -   Use `mcp_search_stripe_documentation` before hallucinating API parameters.
    -   Verify customer state with `mcp_list_customers` during debugging.

### 4. Analytics & Product (PostHog MCP)
-   **Trigger:** Implementing new features or debugging userflows.
-   **Action:**
    -   Use `posthog` to check if a relevant feature flag exists.
    -   Verify event naming conventions align with existing tracking.

### 5. Complex Reasoning (Sequential Thinking MCP)
-   **Trigger:** Architectural decisions, debugging complex race conditions, or planning large refactors.
-   **Action:**
    -   Explicitly invoke `sequentialThinking` to break down the problem.
    -   Output a step-by-step hypothesis plan before executing code.

### 5. Browser/E2E Testing (Playwright MCP)
-   **Trigger:** working on UI components or critical user flows (auth, payments).
-   **Action:**
    -   Use `playwright` to validte the CSS selector is accessible.
    -   Draft E2E tests based on the actual DOM structure.

## 🏗️ DTD Project Standards

### Tech Stack
-   **Framework:** Next.js 16+ (App Router)
-   **Language:** TypeScript (Strict Mode)
-   **Styling:** Tailwind CSS + Shadcn UI
-   **State:** Server Components preferred; Client Components only when interactivity is required.

### Code Style Guidelines
-   **Interfaces:** Prefix with `I` is DEPRECATED. Use `User`, `Trainer` (PascalCase).
-   **Components:** Named exports only. `export function MyComponent() {}`.
-   **Error Handling:** Use `src/lib/safe-action` patterns for server actions.

## 🚀 Workflow Protocol
1.  **Discovery:** Run `ls` or `view_file` to understand local context.
2.  **Enrichment:** Call MCP tools (Supabase/PostHog) to get remote context.
3.  **Plan:** Use `sequentialThinking` if the task is >3 steps.
4.  **Execute:** Write code.
5.  **Verify:** Run tests or use Playwright to verify UI.
