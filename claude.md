# claude.md: Automated Repository Setup Playbook

This is a **fully executable** guide for Claude to autonomously set up production-ready GitHub repositories following Trent's established patterns. Every section includes scripts, commands, and templates Claude can run directly.

**When to use:**
- New project? Give Claude the brief + point to this file
- Claude will: scaffold repo, create files, configure GitHub, set up workflows, initialize wiki
- You will: review + push

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

**Key tool: `gh` (GitHub CLI) installed and authenticated locally**

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

**First step:** Delete all unused sections from this file, then execute the remaining ones in order.

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
    "lint": "eslint src/ --max-warnings=0",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^latest",
    "eslint": "^latest",
    "prettier": "^latest",
    "vitest": "^latest"
  }
}
```

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
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v4
        if: always()
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

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
          cache: 'npm'
      - run: npm ci
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

Settings → Branches → Add Rule for `main`:

```
Pattern: main

✅ Require a pull request before merging
✅ Dismiss stale pull request approvals
✅ Require status checks to pass:
   • Lint & Test / lint
   • Lint & Test / test
   • Security Checks / codeql
✅ Require branches up to date before merging
✅ Require conversation resolution
✅ Automatically delete head branches
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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

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

Use the same `.github/workflows/labeler.yml` and `.github/labeler.yml` from Section A.

---

## Section C: Both (GitHub Pages Demo + Docker Self-Hosting)

Combine A and B structures with separate deploy workflows for each.

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
          cache: 'npm'
      - run: npm ci
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

Claude should run these `gh` commands:

```bash
#!/bin/bash
REPO=[REPO_NAME]
OWNER=[GITHUB_USER]

# Repository metadata
gh repo edit $OWNER/$REPO \
  --description "[ONE_SENTENCE]" \
  --homepage "[DEPLOYMENT_URL]" \
  --visibility public

# Features
gh repo edit $OWNER/$REPO \
  --enable-issues \
  --enable-wiki \
  --enable-discussions

# Branch protection (CRITICAL: includes codeql)
gh api repos/$OWNER/$REPO/branches/main/protection \
  -X PUT \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true}' \
  -f required_status_checks='{"strict":true,"contexts":["Lint & Test / lint","Lint & Test / test","Security Checks / codeql"]}' \
  -f enforce_admins=true \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true
```

**NOTE:** `enforce_admins=true` means admins also follow branch protection rules. Adjust if needed.

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
      - run: npm ci
      - run: npm run build
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

# Verify clean git state
if [[ -n $(git status -s) ]]; then
  echo "❌ Uncommitted changes"
  exit 1
fi

# Ensure on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "❌ Must be on main branch"
  exit 1
fi

# Pull latest
git pull origin main

# Bump version (creates tag v0.1.1, etc.)
npm version patch  # or minor, major

# Push
git push origin main --tags
echo "✅ Release created"
```

---

## Section H: Reverse Proxy & Self-Hosting Infrastructure

### H.1 Cloudflare Tunnel Setup (Wiki Page)

Create a wiki page with:

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
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
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
    build: ./packages/server
    volumes:
      - ./packages/server/src:/app/src  # Hot reload
    environment:
      NODE_ENV: development
      DEBUG: '*'
      DEV_FAKE_AUTH: 'true'
    ports:
      - "3000:3000"
      - "9229:9229"  # Debugger
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
  entrypoint: sh -c "npm run migrate:deploy && npm start"
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

Claude should execute this after generating all files:

```bash
#!/bin/bash
PROJECT_NAME="$1"
REPO_TYPE="$2"  # github-pages or docker
GITHUB_USER="$3"

echo "🚀 Setting up $PROJECT_NAME..."

# Create repo
gh repo create "$PROJECT_NAME" --public --source=. --remote=origin --push

# Configure settings
gh repo edit "$GITHUB_USER/$PROJECT_NAME" \
  --enable-issues --enable-wiki --enable-discussions

# Add secrets (conditional by type)
if [[ "$REPO_TYPE" == "docker" ]]; then
  gh secret set CODECOV_TOKEN --body "${CODECOV_TOKEN:-}"
elif [[ "$REPO_TYPE" == "github-pages" ]]; then
  gh secret set CODECOV_TOKEN --body "${CODECOV_TOKEN:-}"
fi

# Branch protection (with codeql check)
gh api repos/$GITHUB_USER/$PROJECT_NAME/branches/main/protection \
  -X PUT \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true}' \
  -f required_status_checks='{"strict":true,"contexts":["Lint & Test / lint","Lint & Test / test","Security Checks / codeql"]}' \
  -f enforce_admins=true \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true

# Labels (core set)
gh label create "bug" --repo "$GITHUB_USER/$PROJECT_NAME" --color "ff0000"
gh label create "enhancement" --repo "$GITHUB_USER/$PROJECT_NAME" --color "0000ff"
gh label create "documentation" --repo "$GITHUB_USER/$PROJECT_NAME" --color "00ff00"
gh label create "good-first-issue" --repo "$GITHUB_USER/$PROJECT_NAME" --color "ff00ff"
gh label create "dependencies" --repo "$GITHUB_USER/$PROJECT_NAME" --color "cccccc"

# Milestones
gh milestone create "Alpha" --repo "$GITHUB_USER/$PROJECT_NAME"
gh milestone create "Beta" --repo "$GITHUB_USER/$PROJECT_NAME"
gh milestone create "v1.0" --repo "$GITHUB_USER/$PROJECT_NAME"

echo "✅ Setup complete!"
```

---

## Section M: Code Owners & Maintenance Policy

### M.1 CODEOWNERS File

Already covered in Section F.2 — place at `.github/CODEOWNERS`:

```
* @[GITHUB_USER]
```

---

## Section N: Dependency Management Strategy

### N.1 Dependabot Config

Already provided in Section A/B `.github/dependabot.yml`.

### N.2 Auto-Merge Policy

- ✅ Patch/minor updates: auto-merge if tests pass
- ❌ Major updates: require manual review

---

## Section O: Repository Documentation for Developers

### O.1 Developer README

Create a `README.md` section or separate docs for developers:

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

Auto-labeling is configured in `.github/workflows/labeler.yml` and `.github/labeler.yml` (from Section A).

Claude should create these core labels manually if auto-creation is needed:

```bash
gh label create "bug" --repo "$OWNER/$REPO" --color "ff0000"
gh label create "enhancement" --repo "$OWNER/$REPO" --color "0000ff"
gh label create "documentation" --repo "$OWNER/$REPO" --color "00ff00"
gh label create "good-first-issue" --repo "$OWNER/$REPO" --color "ff00ff"
gh label create "dependencies" --repo "$OWNER/$REPO" --color "cccccc"
```

Add more labels as needed, but keep the core set.

### P.2 Milestones

Create these to match your versioning strategy (from Section G):

```bash
gh milestone create "Alpha" --repo "$OWNER/$REPO"
gh milestone create "Beta" --repo "$OWNER/$REPO"
gh milestone create "v1.0" --repo "$OWNER/$REPO"
```

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

**Example:**

```
✅ Section B Complete!
  - Generated docker-compose.prod.yml
  - Created backup service
  
🗑️ Deleting Section B...

📊 Progress:
   ☑ B: Docker Stack Template
   ☐ F: GitHub Settings & Metadata
   ☐ G: Releases, Versioning & Changelog
   ... (3 more to go)

➡️ Ready for Section F when you are.
```

