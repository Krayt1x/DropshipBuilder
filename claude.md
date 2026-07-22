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
☑ F: GitHub Settings & Metadata — done
☑ G: Releases, Versioning & Changelog — workflow + versioning scheme in place
☑ H: Reverse Proxy & Self-Hosting — done
☑ I: Health Checks & Monitoring — done
☑ J: Development vs Production Environments — done
☑ K: Database Migrations & Backups — done
☑ L: Repository Bootstrap Script — done (repo already existed; metadata/protection/settings applied)
☑ M: Code Owners & Maintenance Policy — done
☑ N: Dependency Management Strategy — done
☑ O: Repository Documentation for Developers — done
☑ P: Labels & Milestones — done
```

All sections complete. DropshipBuilder repo is fully scaffolded and configured:

- Repo: `Krayt1x/DropshipBuilder`, public, description + homepage set, issues/wiki/discussions enabled
- Branch protection on `main`: required status checks (lint, test, codeql), enforce_admins, dismiss stale reviews, conversation resolution required, auto-merge + delete-branch-on-merge enabled
- Labels: bug, enhancement, documentation, good-first-issue, dependencies (plus GitHub/dependabot defaults)
- Milestones: Alpha, Beta, v1.0
- All CI/CD workflows, Docker stack, and docs committed to `main`

**Note for future reference:** this `gh` CLI version has no `gh milestone` subcommand — use `gh api repos/{owner}/{repo}/milestones -f title="..."` instead. Also, passing nested JSON as a `-f key='{"a":true}'` string to `gh api` on PowerShell gets its quotes stripped by native-exe argument passing — write the payload to a JSON file and use `--input <file>` instead.

Nothing left to execute from this playbook for this project. Keeping this file only as a record — safe to delete once you've reviewed the summary above.
