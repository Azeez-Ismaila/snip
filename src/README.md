# snip ✂️

A URL shortener built as a from-scratch **DevOps portfolio project**: from a laptop app to a GitOps-managed Kubernetes cluster on Proxmox.

## Features
- Shorten URLs and redirect with click counting
- REST API with a health check endpoint (`/healthz`)
- JSON structured logging and graceful shutdown
- Automated tests and linting

## Run locally
```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run lint
```

## API
| Method | Path | Description |
|---|---|---|
| POST | `/api/links` | Create a short link: `{"url": "https://..."}` |
| GET | `/:code` | Redirect to the original URL |
| GET | `/api/links/:code` | Link stats |
| GET | `/healthz` | Health check |

## Roadmap
- [x] Phase 1: Node.js/Express API with tests
- [x] Phase 2: GitHub workflow (protected main, PRs, squash merges)
- [ ] Phase 3: Docker and Docker Compose (PostgreSQL, Redis)
- [ ] Phase 4: CI pipeline with GitHub Actions
- [ ] Phase 5: Terraform on Proxmox
- [ ] Phase 6: Ansible configuration
- [ ] Phase 7: Docker Compose deployment over SSH
- [ ] Phase 8: Kubernetes (k3s) cluster
- [ ] Phase 9: Helm chart
- [ ] Phase 10: GitOps with Argo CD (staging and production)
- [ ] Phase 11: Ingress, TLS, public access
- [ ] Phase 12: Secrets management
- [ ] Phase 13: Observability (Prometheus, Grafana, Loki)
- [ ] Phase 14: Reliability and backups
- [ ] Phase 15: Security hardening
