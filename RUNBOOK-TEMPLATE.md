# RUNBOOK-TEMPLATE.md: Automated Repository Setup Playbook

This is a **fully executable** guide for Claude to autonomously set up production-ready GitHub repositories following Trent's established patterns. Every section includes scripts, commands, and templates Claude can run directly.

**When to use:**
- New project? Give Claude the brief + point to this file (copy it into the new repo as `claude.md`)
- Claude will: scaffold repo, create files, configure GitHub, set up workflows, initialize wiki
- You will: review + push

This version incorporates fixes found while running the playbook end-to-end on DropshipBuilder (2026-07-22) — see **Known Gotchas** below before executing anything.

---

## Known Gotchas (read this before running Section F/L/P)

These bit us on the first real run. They're baked into the templates below, but if you're improvising, keep them in mind:

1. **`gh` on Windows may be installed but not on PATH in the current shell.** Check `winget list --id GitHub.cli`; if found but `gh` isn't recognized, locate the binary directly (typically `C:\Program Files\GitHub CLI\gh.exe`) and call it by full path.
2. **`gh auth login` needs an interactive browser/device-code flow.** An agent running in a non-interactive shell cannot complete it. Ask the user to run it themselves in a real terminal, then verify with `gh auth status` before proceeding.
3. **PowerShell mangles embedded JSON quotes** when you pass `-f key='{"a":true}'` style arguments to a native `.exe`. The double quotes get stripped by Win32 argument parsing before `gh` ever sees them, causing cryptic 422 schema errors. **Always write the JSON body to a file and use `gh api ... --method PUT --input <file>`** instead of inline `-f` strings for anything with nested objects.
4. **Branch protection requires a public repo** (or GitHub Pro for private repos). Check current visibility first (`gh repo view --json visibility`) and get explicit confirmation before flipping a private repo public — it's a visible, easily-missed side effect.
5. **`allow_auto_merge` and `delete_branch_on_merge` are NOT branch-protection fields.** They're repo-level settings. Set them with `gh repo edit --enable-auto-merge --delete-branch-on-merge` (note: `--enable-auto-merge`, not `--allow-auto-merge` — the flag name in older playbook drafts was wrong).
6. **`gh milestone` is not a real `gh` subcommand** (at least as of gh 2.96.0). Use the REST API directly: `gh api repos/{owner}/{repo}/milestones -f title="Alpha"`.
7. **Required status check names must exactly match the real check-run name, not `"Workflow Name / job name"`.** For a simple job it's just the job name (`lint`, `test`). For a matrix job it's `job name (matrix-value)`, e.g. `codeql (javascript-typescript)` — **no workflow-name prefix at all**. Get the real names from `gh api repos/{owner}/{repo}/commits/{sha}/check-runs --jq '.check_runs[].name'` on a commit that has already run the workflows, rather than guessing from the YAML. A mismatched context makes `mergeStateStatus` sit at `BLOCKED` forever with no useful error — everything looks green but nothing merges.
8. **`required_approving_review_count` defaults to 1** if you don't set it explicitly in `required_pull_request_reviews`. GitHub will not let a PR author approve their own PR, so on a solo-maintainer repo this deadlocks every single PR under auto-merge. Ask the user; default to `0` for solo projects, `1`+ for anything with other collaborators.
9. **Set required status checks only after the workflows have run at least once** (open a throwaway PR first, or just do it as part of the very first real PR) — that's the only reliable way to get the exact check-run names from gotcha #7.
10. **Once `enforce_admins: true` is set, even the repo owner/admin can't push directly to the protected branch** — including you, mid-setup. Any further fixes have to go through a PR. This is intentional, but plan for it: do local scaffolding and generic setup *before* applying branch protection, not after.
11. **No `package-lock.json` may exist** if the environment doing the scaffolding has no Node/npm available. `npm ci` hard-fails without a lockfile, and `actions/setup-node`'s `cache: 'npm'` also fails without one to hash. Default new workflows to `npm install` and skip the `cache: 'npm'` option; switch to `npm ci` + caching only after a lockfile has actually been committed (have the user run `npm install` once locally).
12. **ESLint 9+ requires flat config** (`eslint.config.js`), not `.eslintrc.json`. The legacy format silently isn't picked up and the run fails with "ESLint couldn't find an eslint.config.js file."
13. **Plain ESLint doesn't know JSX counts as using an imported identifier.** `import App from './App.jsx'` + `<App />` gets flagged `no-unused-vars` without `eslint-plugin-react`'s `jsx-uses-vars`/`jsx-uses-react` rules wired into the flat config.
14. **Don't gate CI on `prettier --check` for a repo whose first commit was scaffolded without ever running Prettier.** You can't verify exact output by hand. Put formatting in its own job with `continue-on-error: true` (not in the required-checks list) until someone runs `npm run format` locally once and commits the result — then it's safe to make required.

---

## Execution Tracking (IMPORTANT)

**As you complete each section, DELETE IT from this file.**

This keeps the file focused on what's remaining and prevents re-running completed work.

### Completed Sections (Remove After Finishing)

After completing each step below, Claude should:
1. Delete the entire section heading and content
2. Update the "Progress" checklist
3. Save and show the updated file
4. Continue to the next section

### Progress Checklist

```
Sections to Complete:

☐ A: GitHub Pages SPA Template (if applicable)
☐ B: Docker Stack Template (if applicable)
☐ C: Both (Demo + Self-Hosting) (if applicable)
☐ D: Data Specification (if data-driven)
☐ E: Authentication & Persistence (if multi-user)
☐ F: GitHub Settings & Metadata
☐ G: Releases, Versioning & Changelog
☐ H: Reverse Proxy & Self-Hosting
☐ I: Health Checks & Monitoring
☐ J: Development vs Production Environments
☐ K: Database Migrations & Backups
☐ L: Repository Bootstrap Script
☐ M: Code Owners & Maintenance Policy
☐ N: Dependency Management Strategy
☐ O: Repository Documentation for Developers
☐ P: Labels & Milestones
```

**Example workflow:**
```
1. User: "Set up MyApp using claude.md, it's a Docker stack"
2. Claude: "I'll complete sections B, F, G, H, I, J, K, P"
3. Claude completes Section B (creates files)
4. Claude deletes Section B from the file
5. Claude updates progress: ☑ B
6. Claude shows remaining sections
7. Claude: "Section B done. Ready for Section F?"
8. Repeat until all sections deleted
```

---

## How Claude Uses This (Automation Pattern)

Instead of asking questions, Claude follows this **execution flow**:

```
1. User provides: "Set up [project name], it's a [type]"
2. Claude determines: Which sections apply (A/B/C, +D/E if needed)
3. Claude generates: All files locally
4. Claude creates: GitHub CLI commands to execute
5. Claude shows: What will happen, asks confirmation
6. User confirms
7. Claude executes: All setup via GitHub API/CLI
```

**Key tool: `gh` (GitHub CLI) installed and authenticated locally.** If it isn't, install it (`winget install --id GitHub.cli --source winget --accept-package-agreements --accept-source-agreements`) and have the user run `gh auth login` themselves — see Gotcha #2.

---

## Quick Routing

**Answer these 3 questions, then DELETE unused sections:**

1. **What type?**
   - GitHub Pages SPA → **Keep:** A, F, G, P | **Delete:** B, C, H, I, J, K
   - Docker stack → **Keep:** B, F, G, H, I, J, K, P | **Delete:** A, C
   - Both → **Keep:** C, F, G, H, I, J, K, P | **Delete:** A, B

2. **Data contributors?** (like FilmCalc)
   - YES → **Keep:** D
   - NO → **Delete:** D

3. **User accounts/auth?** (like QueueUp)
   - YES → **Keep:** E
   - NO → **Delete:** E

**Also ask:** will anyone besides the owner review PRs? This decides `required_approving_review_count` in Section F (0 for solo, 1+ otherwise — see Gotcha #8).

**First step:** Delete all unused sections from this file, then execute the remaining ones in order. Do local scaffolding (A/B/C/D/E/H/I/J/K/M/N/O) and get it merged to main *before* running F's branch protection step — see Gotcha #10.

---

## Section A: GitHub Pages SPA Template

**Examples:** FilmCalc, portfolio, calculator

### A.1 Repo Structure (Auto-Generated)

```
repo-root/
├── .github/
│   ├── workflows/
│   │   ├── lint-and-test.yml
│   │   ├── deploy-to-pages.yml
│   │   ├── security-checks.yml
│   │   └── labeler.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.md
│   │   ├── feature.md
│   │   ├── question.md
│   │   └── config.yml
│   ├── labeler.yml
│   └── dependabot.yml
├── .gitignore
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── .prettierrc.json
├── package.json
├── src/
├── public/
└── dist/ (generated)
```

### A.2 Files (Ready to Generate)

Claude should create a baseline `package.json` with these essential scripts:

```json
{
  "name": "[PROJECT_NAME]",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --max-warnings=0",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "test:ui": "vitest --ui"
  },
  "dependencies": {},
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "eslint": "^9.9.0",
    "eslint-plugin-react": "^7.35.0",
    "globals": "^15.9.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.3.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

`.prettierrc.json` (pin this so `format`/`format:check` are deterministic):
```json
{
  "singleQuote": true,
  "semi": true
}
```

**`eslint.config.js`** (flat config — required for ESLint 9+, see Gotcha #12):
```js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
];
```
Drop the `react` plugin block entirely for non-React projects.

**README.md** (Claude fills in project name + features)
```markdown
# [PROJECT_NAME]

[ONE_SENTENCE_DESCRIPTION]

## Live App

🌐 https://[GITHUB_USER].github.io/[REPO_NAME]

## Features

- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]

## Get Started

👉 **[Full Guide →](https://github.com/[GITHUB_USER]/[REPO_NAME]/wiki)**

## Contributing

- 📖 [Contribution Guide](./CONTRIBUTING.md)

---

Built with [TECH_STACK]. Licensed under MIT.
```

**CONTRIBUTING.md**
```markdown
# Contributing

## Development Setup

\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing Locally

\`\`\`bash
npm run test
\`\`\`

## Before Submitting PR

- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test` passes
- [ ] No console errors

[Project-specific contribution guidelines]
```

**SECURITY.md**
```markdown
# Security Policy

## Reporting Issues

Email: [GITHUB_USER_EMAIL]

Do NOT open a public issue.

## Scope

This is a 100% client-side app — no server, no database.

## Supported Versions

Only `main` branch is supported.
```

### A.3 Workflows

**`.github/workflows/lint-and-test.yml`**

If a `package-lock.json` already exists (check first — `git ls-files package-lock.json`), use `npm ci` + `cache: 'npm'` as normal. **If it doesn't exist yet** (fresh scaffold, no Node available to generate one — see Gotcha #11), use this instead and switch to `npm ci` once a lockfile is committed:

```yaml
name: Lint & Test
on:
  pull_request:
  push:
    branches: [main]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run lint

  format:
    runs-on: ubuntu-latest
    continue-on-error: true  # not required until a lockfile + verified formatting exist — see Gotcha #14
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test
```

Once a lockfile exists, add `cache: 'npm'` back to each `setup-node` step and swap `npm install` → `npm ci` for reproducible installs; fold `format` back into `lint` (or leave it separate and just drop `continue-on-error`) once you've confirmed `npm run format:check` passes clean.

**`.github/workflows/deploy-to-pages.yml`**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**`.github/workflows/security-checks.yml`**
```yaml
name: Security Checks
on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'
jobs:
  codeql:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: ['javascript-typescript']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```
Note the resulting required-check name is `codeql (javascript-typescript)` — see Gotcha #7. Don't hardcode `"Security Checks / codeql"` into branch protection.

**`.github/workflows/labeler.yml`** (Auto-labels PRs based on files changed)
```yaml
name: Labeler
on:
  pull_request_target
permissions:
  contents: read
  pull-requests: write
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: .github/labeler.yml
```

**`.github/labeler.yml`** (Configuration for auto-labeler)
```yaml
bug:
  - changed-files:
    - any-glob-match-patterns:
      - 'src/**'

documentation:
  - changed-files:
    - any-glob-match-patterns:
      - '*.md'
      - 'docs/**'

dependencies:
  - changed-files:
    - any-glob-match-patterns:
      - 'package.json'
      - 'package-lock.json'
```

**`.github/dependabot.yml`**
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "02:00"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "chore(deps):"
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "03:00"
    commit-message:
      prefix: "ci:"
```

### A.4 Branch Protection

Apply this **after** the workflows above have run at least once on a real commit/PR, so you can confirm the real check-run names (Gotcha #7, #9):

```bash
GH="gh"   # or full path, e.g. "C:\Program Files\GitHub CLI\gh.exe" — see Gotcha #1
OWNER=[GITHUB_USER]
REPO=[REPO_NAME]

# Confirm exact check-run names from a commit that already ran CI:
$GH api repos/$OWNER/$REPO/commits/$(git rev-parse HEAD)/check-runs --jq '.check_runs[].name'
```

Write the protection body to a file (Gotcha #3) — e.g. `branch-protection.json`:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "test", "codeql (javascript-typescript)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_conversation_resolution": true
}
```
Set `required_approving_review_count` to `1`+ if there are other maintainers (Gotcha #8). Confirm repo is public first (Gotcha #4). Then:

```bash
$GH api repos/$OWNER/$REPO/branches/main/protection --method PUT --input branch-protection.json
$GH repo edit $OWNER/$REPO --enable-auto-merge --delete-branch-on-merge
```

---

## Section B: Docker Stack Template

**Examples:** QueueUp, game servers, dashboards

### B.1 Repo Structure

```
repo-root/
├── .github/
│   ├── workflows/
│   │   ├── lint-and-test.yml
│   │   ├── build-and-publish.yml
│   │   ├── security-checks.yml
│   │   ├── auto-merge-dependabot.yml
│   │   └── labeler.yml
│   ├── labeler.yml
│   ├── ISSUE_TEMPLATE/
│   └── dependabot.yml
├── docker/
│   ├── Dockerfile
│   └── backup-entrypoint.sh
├── packages/
├── prisma/
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc.json
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CODEOWNERS
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── data/ (auto-created)
```

### B.2 Files

**README.md**
```markdown
# [PROJECT_NAME]

[ONE_SENTENCE_DESCRIPTION]

## Quick Start

\`\`\`bash
git clone https://github.com/[GITHUB_USER]/[REPO_NAME].git
cd [REPO_NAME]
cp .env.example .env
# Edit .env with your settings
docker compose -f docker-compose.prod.yml up -d
\`\`\`

Open http://localhost:3000

## Documentation

👉 **[Setup Guide →](https://github.com/[GITHUB_USER]/[REPO_NAME]/wiki/Installation-Setup)**

---

Built with [TECH_STACK]. Licensed under MIT.
```

**.env.example**
```bash
APP_BASE_URL=http://localhost:3000
PORT=3000
SESSION_SECRET=generate-random-string

POSTGRES_USER=appname
POSTGRES_PASSWORD=changeme
POSTGRES_DB=appname
DATABASE_URL=postgresql://appname:changeme@localhost:5432/appname

# API keys
[YOUR_REQUIRED_VARS]

# Auth (optional)
GOOGLE_CLIENT_ID=
DEV_FAKE_AUTH=false
```

**.dockerignore**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
data/
.vscode
dist/
.DS_Store
```

**docker/Dockerfile** — if no `package-lock.json` exists yet (Gotcha #11), use `npm install` instead of `npm ci`:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY packages/server/package.json packages/server/package.json
RUN npm install --workspace packages/server --omit=dev

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "src/index.js"]
```
Once a lockfile is committed, switch to `COPY package.json package-lock.json* ./` + `npm ci --workspace packages/server --omit=dev` for reproducible builds.

**docker-compose.prod.yml**
```yaml
name: [appname]

services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-appname}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: ${POSTGRES_DB:-appname}
    volumes:
      - ${DATA_DIR:-./data}/postgres:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-appname}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:8-alpine
    restart: unless-stopped
    volumes:
      - ${DATA_DIR:-./data}/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  backup:
    image: postgres:18-alpine
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-appname}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: ${POSTGRES_DB:-appname}
      BACKUP_DIR: /backups
      BACKUP_INTERVAL_HOURS: 24
      BACKUP_RETENTION_COUNT: 14
    volumes:
      - ./docker/backup-entrypoint.sh:/backup-entrypoint.sh:ro
      - ${DATA_DIR:-./data}/backups:/backups
    entrypoint: ["/bin/sh", "/backup-entrypoint.sh"]

  server:
    image: ghcr.io/[GITHUB_USER]/[REPO_NAME]:${IMAGE_TAG:-latest}
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-appname}:${POSTGRES_PASSWORD:-changeme}@postgres:5432/${POSTGRES_DB:-appname}
      REDIS_URL: redis://redis:6379
      PORT: 3000
      APP_BASE_URL: ${APP_BASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
    entrypoint: sh -c "npx prisma migrate deploy && node src/index.js"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```
(`wget` is present in the `node:*-alpine` runtime image; `curl` usually isn't unless installed — swap back to `curl -f` if the base image includes it.)

### B.3 Workflows

**`.github/workflows/build-and-publish.yml`**
```yaml
name: Build and Publish Docker Image
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  packages: write
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**`.github/workflows/auto-merge-dependabot.yml`**
```yaml
name: Auto-Merge Dependabot
on: pull_request
permissions:
  pull-requests: write
  contents: write
jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - uses: dependabot/fetch-metadata@v2
        id: metadata
      - if: |
          steps.metadata.outputs.update-type == 'version-update:semver-minor' ||
          steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: |
          gh pr merge --auto --squash "${{ github.event.pull_request.number }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Use the same `.github/workflows/labeler.yml` and `.github/labeler.yml` from Section A. Use the lockfile-aware `lint-and-test.yml` from Section A.3.

---

## Section C: Both (GitHub Pages Demo + Docker Self-Hosting)

Combine A and B structures with separate deploy workflows for each. For a monorepo (`packages/client`, `packages/server`), point the Pages workflow at `npm run build --workspace packages/client` and the Docker workflow at `packages/server`; set `VITE_BASE_PATH=/[REPO_NAME]/` when building the client for a project-page deployment (not needed for a user/org page).

---

## Section D: Data Specification (Data-Driven Apps)

### D.1 DATA_SPEC.md Template

```markdown
# [PROJECT_NAME] Data Specification

This is the authoritative spec for [PROJECT_NAME]'s data format.

**If you are an AI: follow every rule exactly.**

## Rules for All Entries

1. Never invent data. Write UNKNOWN if unsure.
2. Use regular prices, not sales.
3. All prices: plain numbers (24.95 not $24.95)
4. YAML: 2-space indentation, never tabs.

## [ENTITY] Entries

Goes in: `[entities]/[location].yaml`

[Define fields, rules, examples]
```

### D.2 Claude Contribution Links

In README.md:

```markdown
## Contribute [ENTITY]

**[→ Add via Claude](https://claude.ai/new?q=I%20want%20to%20add%20a%20[ENTITY]%20to%20[PROJECT].%0A%0ARead%20the%20spec%3A%0Ahttps%3A//raw.githubusercontent.com/[GITHUB_USER]/[REPO_NAME]/main/DATA_SPEC.md%0A%0AGenerate%20YAML%20for%3A%0A%5BPASTE%20LINK%5D)**
```

### D.3 Validation Workflow

```yaml
name: Validate Data
on:
  pull_request:
    paths:
      - '[entities]/**'
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run validate:data
      - run: npm run build:indices
      - run: |
          if [[ -n $(git status --short *.index.json) ]]; then
            echo "Run: npm run build:indices"
            exit 1
          fi
```

---

## Section E: Authentication & Persistence

### E.1 .env Auth Variables

```bash
# Auth Providers
GOOGLE_CLIENT_ID=
DISCORD_CLIENT_ID=
STEAM_API_KEY=
OIDC_ISSUER_URL=

# Session
SESSION_SECRET=generate-64-random-characters
TRUST_PROXY=true

# Dev Bypass
DEV_FAKE_AUTH=false
```

### E.2 Prisma Schema (Example)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  createdAt DateTime @default(now())
}
```

---

## Section F: GitHub Settings & Metadata

### F.1 Auto-Configuration Script

```bash
GH="gh"   # or full path on Windows — see Gotcha #1
OWNER=[GITHUB_USER]
REPO=[REPO_NAME]

# Repository metadata
$GH repo edit $OWNER/$REPO \
  --description "[ONE_SENTENCE]" \
  --homepage "[DEPLOYMENT_URL]"

# Check current visibility before changing it — Gotcha #4
$GH repo view $OWNER/$REPO --json visibility
# Only if confirmed with the user and currently private:
$GH repo edit $OWNER/$REPO --visibility public --accept-visibility-change-consequences

# Features
$GH repo edit $OWNER/$REPO \
  --enable-issues \
  --enable-wiki \
  --enable-discussions
```

Branch protection: see Section A.4 for the corrected version (real check names, JSON-file input, review count question). Do this **last**, after at least one PR has exercised the workflows — Gotcha #9, #10.

### F.2 CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Global owners
* @[GITHUB_USER]
```

---

## Section G: Releases, Versioning & Changelog

### G.1 Semantic Versioning

| Phase | Version | When |
|-------|---------|------|
| Alpha | v0.1.x | New features/fixes added |
| Beta | v0.9.x | Feature-complete, testing phase |
| Stable | v1.x.x | Production-ready |

### G.2 CHANGELOG.md Template

```markdown
# Changelog

## [Unreleased]

### Added
- [Feature]

### Fixed
- [Bug fix]

## [1.0.0] - 2024-01-15

### Added
- Core features
```

Add entries under `[Unreleased]` as you merge PRs. When releasing, move `[Unreleased]` to `[version] - YYYY-MM-DD`.

### G.3 Release Workflow

```yaml
name: Create Release
on:
  push:
    tags:
      - 'v*'
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      # CRITICAL: Extract version-specific changelog, not entire file
      - run: |
          VERSION=${GITHUB_REF#refs/tags/}
          sed -n "/^## \[$VERSION\]/,/^## \[/p" CHANGELOG.md | head -n -1 > RELEASE_NOTES.md
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/**
          body_file: RELEASE_NOTES.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### G.4 Release Process

```bash
#!/bin/bash
set -e

if [[ -n $(git status -s) ]]; then
  echo "Uncommitted changes"
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "Must be on main branch"
  exit 1
fi

git pull origin main
npm version patch  # or minor, major
git push origin main --tags
```
Note: once branch protection with `enforce_admins: true` is live, this can't push a version-bump commit directly to `main` either — it needs to go through a PR too (Gotcha #10).

---

## Section H: Reverse Proxy & Self-Hosting Infrastructure

### H.1 Cloudflare Tunnel Setup (Wiki Page)

```markdown
# Deploying with Cloudflare Tunnel

## Prerequisites
- Cloudflare account
- Domain at Cloudflare

## 1. Create Tunnel
\`\`\`bash
cloudflare tunnel login
cloudflare tunnel create [app-name]
\`\`\`

## 2. Configure Route
Edit `~/.cloudflare-warp/config.yml`:
\`\`\`yaml
tunnel: [app-name]
ingress:
  - hostname: [subdomain].example.com
    service: http://localhost:3000
  - service: http_status:404
\`\`\`

## 3. Start & Route
\`\`\`bash
cloudflare tunnel run [app-name]
# Then point DNS: [subdomain] CNAME tunnel.example.com
\`\`\`
```

### H.2 .env for Reverse Proxy

```bash
APP_BASE_URL=https://[subdomain].example.com
TRUST_PROXY=true
SESSION_COOKIE_SECURE=true
```

---

## Section I: Health Checks & Monitoring

### I.1 Healthcheck in docker-compose.yml

```yaml
services:
  server:
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### I.2 Simple Health Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

---

## Section J: Development vs Production Environments

### J.1 docker-compose.dev.yml

```yaml
services:
  server:
    build:
      context: .
      dockerfile: docker/Dockerfile
    volumes:
      - ./packages/server/src:/app/packages/server/src  # Hot reload
    environment:
      NODE_ENV: development
      DEV_FAKE_AUTH: 'true'
    ports:
      - "3000:3000"
```

### J.2 .env Splits

- `.env.development` (checked in, dev defaults)
- `.env.production` (user-specific, gitignored)

---

## Section K: Database Migrations & Backups

### K.1 Migrations on Startup

In docker-compose.prod.yml:

```yaml
server:
  entrypoint: sh -c "npx prisma migrate deploy && node src/index.js"
```

### K.2 Backup Script

`docker/backup-entrypoint.sh` runs automatically in the backup service from docker-compose.yml.

### K.3 Restore Procedure

```bash
gunzip < ./data/backups/backup_*.sql.gz | \
  docker compose exec -T postgres psql -U appname -d appname
```

---

## Section L: Repository Bootstrap Script

If the repo/remote already exists (check `git remote -v` first), skip `gh repo create` and just push. Otherwise:

```bash
GH="gh"
PROJECT_NAME="$1"
GITHUB_USER="$3"

$GH repo create "$PROJECT_NAME" --public --source=. --remote=origin --push

$GH repo edit "$GITHUB_USER/$PROJECT_NAME" \
  --enable-issues --enable-wiki --enable-discussions

# Branch protection: see Section A.4 — do this last, after CI has run once.

# Labels
$GH label create "bug" --repo "$GITHUB_USER/$PROJECT_NAME" --color "ff0000" --force
$GH label create "enhancement" --repo "$GITHUB_USER/$PROJECT_NAME" --color "0000ff" --force
$GH label create "documentation" --repo "$GITHUB_USER/$PROJECT_NAME" --color "00ff00" --force
$GH label create "good-first-issue" --repo "$GITHUB_USER/$PROJECT_NAME" --color "ff00ff" --force
$GH label create "dependencies" --repo "$GITHUB_USER/$PROJECT_NAME" --color "cccccc" --force

# Milestones — gh has no "milestone" subcommand, use the API (Gotcha #6)
$GH api repos/$GITHUB_USER/$PROJECT_NAME/milestones -f title="Alpha"
$GH api repos/$GITHUB_USER/$PROJECT_NAME/milestones -f title="Beta"
$GH api repos/$GITHUB_USER/$PROJECT_NAME/milestones -f title="v1.0"
```

---

## Section M: Code Owners & Maintenance Policy

Already covered in Section F.2 — place at `.github/CODEOWNERS`:

```
* @[GITHUB_USER]
```

---

## Section N: Dependency Management Strategy

Already provided in Section A/B `.github/dependabot.yml`.

- ✅ Patch/minor updates: auto-merge if tests pass
- ❌ Major updates: require manual review

---

## Section O: Repository Documentation for Developers

Add to README.md:

```markdown
## Development

### Stack
[Brief tech stack overview]

### Getting Started
[Local setup instructions]

### Project Structure
[Where things are]

### Testing
[How to run tests]

### Building
[How to build for deployment]
```

---

## Section P: Labels & Milestones

### P.1 Core Labels

Auto-labeling is configured in `.github/workflows/labeler.yml` and `.github/labeler.yml` (from Section A). Core labels still need manual creation — see Section L for the `gh label create` commands (use `--force` so re-runs don't error on existing labels).

### P.2 Milestones

See Section L — created via `gh api repos/{owner}/{repo}/milestones`, not `gh milestone` (Gotcha #6).

### P.3 Label/Milestone Workflow

- **PRs are auto-labeled** by `.github/labeler.yml` based on files changed
- **Assign to milestone** when merging: current version if bug/docs, next version if feature
- **When releasing:** move all issues from [Unreleased] to that version in CHANGELOG

---

## ⚙️ After Each Section Completes

**IMPORTANT: Claude should do this after finishing each section:**

1. ✅ Confirm section is complete
2. 🗑️ Delete the entire section (heading + all content)
3. ✏️ Update the Progress checklist above (☑ mark)
4. 💾 Save the file
5. 📊 Show updated progress
6. ➡️ Continue to next section
