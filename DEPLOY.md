# Deploy — GCE VM + docker compose

One small always-on VM runs the whole platform: Postgres, the API (with the scheduler), the
web UI, and Caddy terminating TLS with basic auth. Total ~$15–20/mo (e2-small + 20 GB disk +
static IP).

```
internet → Caddy :443 (TLS + basic auth) → /api/* → api:8000
                                         → /*     → web:80 (SPA)
          api ↔ db (compose network; 5432/8000/3000 bound to 127.0.0.1 only)
```

## 0. You need (can't be scripted)

- A GCP project with billing enabled, `gcloud` authenticated (`gcloud auth login`).
- A domain you control (any registrar) — one A record will point at the VM.
- Credentials for the VM's `.env`: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `FINNHUB_API_KEY`,
  `SEC_USER_AGENT` (your "app-name (contact-email)" for EDGAR), SMTP credentials (e.g. a
  Gmail app password), and a strong `POSTGRES_PASSWORD`.
- Git access from the VM (public repo, or add a deploy key).

## 1. Reserve the IP and create the VM

```bash
gcloud config set project YOUR_PROJECT
gcloud config set compute/zone us-central1-a        # pick yours

gcloud compute addresses create stock-agent-ip --region=us-central1
gcloud compute addresses describe stock-agent-ip --region=us-central1 --format='value(address)'

gcloud compute instances create stock-agent \
  --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server \
  --address=stock-agent-ip
```

The `http-server`/`https-server` tags attach the default firewall rules for 80/443. Nothing
else is exposed — db/api/web publish on the VM's loopback only.

Create the **DNS A record** now: `stocks.yourdomain.com → <static IP>`.

## 2. Install Docker on the VM

```bash
gcloud compute ssh stock-agent

# on the VM:
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && exit   # re-ssh so the group applies
```

## 3. Clone and configure

```bash
gcloud compute ssh stock-agent
git clone https://github.com/YOUR_USER/ai-stock-agent.git && cd ai-stock-agent
cp .env.example .env
nano .env
```

Fill every `PLACEHOLDER`, then the VM-specific bits:

- `ENABLE_SCHEDULER=true` — this host is the always-on one.
- `DOMAIN=stocks.yourdomain.com`
- `BASIC_AUTH_USER` + `BASIC_AUTH_HASH`:

```bash
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'choose-a-long-password'
# paste the $2a$... output into BASIC_AUTH_HASH as-is
```

## 4. Launch

```bash
docker compose --profile prod up -d --build
```

Migrations run automatically (the `migrate` service) before the API starts. Caddy obtains the
certificate on first hit — give DNS a minute. Then:

- `https://stocks.yourdomain.com` → basic-auth challenge → the UI.
- `https://stocks.yourdomain.com/api/health` → `{"status":"ok"}`.
- First visit: **Settings** → email address, digest/brief channels, weekly token budget,
  brief mega-caps. (Brief channels on a Linux VM: use `email` + `in_app`; iMessage only works
  on a macOS host, WhatsApp isn't wired yet.)

Sanity-check the exposure: `curl http://<ip>:8000/health` from your laptop must **fail**.

## 5. Operations

```bash
# logs
docker compose logs -f api
docker compose logs -f caddy

# update to latest main
git pull && docker compose --profile prod build && docker compose --profile prod up -d

# disk snapshots (the DB volume lives on the boot disk at src/backend/data/postgres)
gcloud compute resource-policies create snapshot-schedule stock-agent-daily \
  --region=us-central1 --max-retention-days=14 \
  --daily-schedule --start-time=08:00
gcloud compute disks add-resource-policies stock-agent \
  --resource-policies=stock-agent-daily --zone=us-central1-a

# ad-hoc DB dump
docker exec ai-stock-agent-db pg_dump -U stockagent stockagent | gzip > snapshot.sql.gz
```

Set a **billing alert** in the GCP console (Billing → Budgets) — the agent's real spend cap is
the weekly token budget in Settings, but a belt goes with suspenders.

## Local development (unchanged)

```bash
docker compose up -d            # db + api + web on localhost:3000 (no Caddy)
# backend dev loop:
cd src/backend && source .venv/bin/activate && uvicorn app.main:app --reload
# frontend dev loop (talks to uvicorn via the Vite proxy):
cd src/frontend && npm run dev  # localhost:5173
# regenerate the typed API client after changing routes/schemas:
cd src/frontend && npm run gen:api
```
