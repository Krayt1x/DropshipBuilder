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

### Progress Checklist

```
Sections to Complete:

☑ A: GitHub Pages SPA Template — not applicable (project is type "Both")
☑ B: Docker Stack Template — not applicable (project is type "Both")
☑ C: Both (Demo + Self-Hosting) — done, all local files generated
☑ D: Data Specification — not applicable (no data contributors)
☑ E: Authentication & Persistence — not applicable (no auth)
☐ F: GitHub Settings & Metadata — BLOCKED on gh CLI (not installed)
☐ G: Releases, Versioning & Changelog — workflow done; process/versioning notes remain
☑ H: Reverse Proxy & Self-Hosting — done (.env vars in place; wiki page not created, no wiki yet)
☑ I: Health Checks & Monitoring — done (/health endpoint + compose healthchecks)
☑ J: Development vs Production Environments — done (docker-compose.dev.yml)
☑ K: Database Migrations & Backups — done (migrate deploy on boot, backup service)
☐ L: Repository Bootstrap Script — BLOCKED on gh CLI (repo already exists, so only secrets/protection/labels/milestones remain)
☑ M: Code Owners & Maintenance Policy — done (.github/CODEOWNERS)
☑ N: Dependency Management Strategy — done (dependabot.yml + auto-merge workflow)
☑ O: Repository Documentation for Developers — done (README Development section)
☐ P: Labels & Milestones — auto-labeler done; manual gh label/milestone creation BLOCKED on gh CLI
```

**Project answers on file:** type = Both, data contributors = No, auth = No. GitHub user = `Krayt1x`, repo = `DropshipBuilder` (remote already configured), description = "A list-building web app for the Dropship tabletop wargame."

---

## Remaining: Sections F, G, L, P (GitHub-side, need `gh` CLI)

`gh` is not installed in this environment (checked bash and PowerShell). Everything below requires it — install and run `gh auth login`, then these commands can run as-is once `$OWNER`/`$REPO` are substituted with `Krayt1x`/`DropshipBuilder`.

### F: GitHub Settings & Metadata

```bash
OWNER=Krayt1x
REPO=DropshipBuilder

# Repository metadata
gh repo edit $OWNER/$REPO \
  --description "A list-building web app for the Dropship tabletop wargame." \
  --homepage "https://Krayt1x.github.io/DropshipBuilder" \
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

### G: Releases, Versioning & Changelog

Semantic versioning: Alpha = v0.1.x, Beta = v0.9.x, Stable = v1.x.x. The release workflow (`.github/workflows/release.yml`) is already in place. Add entries under `[Unreleased]` in CHANGELOG.md as PRs merge; when releasing, move them to a dated version heading.

Release process (no `gh` needed, but confirm with the user before pushing tags/pushing to main):

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

### L: Repository Bootstrap Script

The GitHub repo and remote already exist (`origin` is set to `github.com/Krayt1x/DropshipBuilder`), so `gh repo create` is not needed — just push the local commits. Once `gh` is available:

```bash
OWNER=Krayt1x
REPO=DropshipBuilder

gh repo edit "$OWNER/$REPO" --enable-issues --enable-wiki --enable-discussions

gh secret set CODECOV_TOKEN --body "${CODECOV_TOKEN:-}"

gh api repos/$OWNER/$REPO/branches/main/protection \
  -X PUT \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true}' \
  -f required_status_checks='{"strict":true,"contexts":["Lint & Test / lint","Lint & Test / test","Security Checks / codeql"]}' \
  -f enforce_admins=true \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true
```

### P: Labels & Milestones

Auto-labeling is already configured (`.github/workflows/labeler.yml` + `.github/labeler.yml`). Core labels and milestones still need manual creation once `gh` is available:

```bash
OWNER=Krayt1x
REPO=DropshipBuilder

gh label create "bug" --repo "$OWNER/$REPO" --color "ff0000"
gh label create "enhancement" --repo "$OWNER/$REPO" --color "0000ff"
gh label create "documentation" --repo "$OWNER/$REPO" --color "00ff00"
gh label create "good-first-issue" --repo "$OWNER/$REPO" --color "ff00ff"
gh label create "dependencies" --repo "$OWNER/$REPO" --color "cccccc"

gh milestone create "Alpha" --repo "$OWNER/$REPO"
gh milestone create "Beta" --repo "$OWNER/$REPO"
gh milestone create "v1.0" --repo "$OWNER/$REPO"
```

Workflow going forward: PRs are auto-labeled by file path; assign milestones on merge (current version for bugs/docs, next version for features); move CHANGELOG `[Unreleased]` entries to a dated version on release.
