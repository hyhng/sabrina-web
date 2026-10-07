# Server — setting it up and running it

The admin (`apps/cms`) on a Hetzner CAX11, behind Caddy, next to Postgres
(docs/TECH.md 7). The public site is not here: it is static on Cloudflare Pages
and never touches this machine.

Everything below was rehearsed locally against the real image — Apple Silicon is
the same `arm64` as the CAX11 — so the first run on the server should hold no
surprises. What could not be rehearsed is named as such.

## What is in this folder

| File                      | What it is                                                              |
| ------------------------- | ----------------------------------------------------------------------- |
| `Dockerfile`              | the admin as an `arm64` + `amd64` image; build context is the repo root |
| `docker-compose.yml`      | **local only** — a Postgres for `pnpm dev:cms`                          |
| `docker-compose.prod.yml` | the server: `caddy` + `db` + `cms`                                      |
| `Caddyfile`               | TLS and the reverse proxy for `admin.<domain>`                          |
| `backup.sh`               | daily `pg_dump` → R2, 30 days of retention                              |

## First run on a new server

Ubuntu LTS, logged in as root over SSH.

```bash
# 1. The machine itself
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 ufw unattended-upgrades
systemctl enable --now docker
dpkg-reconfigure --priority=low unattended-upgrades   # answer yes

# 2. Firewall. Nothing but SSH and HTTP(S) — the database is not published by
#    docker-compose.prod.yml and must stay that way.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 3. SSH by key only
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh

# 4. The stack
mkdir -p /opt/sabrina && cd /opt/sabrina
git clone https://github.com/hyhng/sabrina-web.git .
cd infra
cp ../.env.example .env && nano .env     # see below
docker login ghcr.io                     # a GitHub token with read:packages
docker compose -f docker-compose.prod.yml up -d
```

Then open `https://admin.<domain>`. The first visit creates the first account —
whoever gets there first owns the admin, so do it immediately and hand the
account to Sabrina.

### What `.env` needs

Beside `docker-compose.prod.yml`. Compose refuses to start without the first
five and says which one is missing:

| Variable                                                                     | Notes                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ADMIN_DOMAIN`                                                               | `admin.<domain>`. Caddy gets the certificate for this name                                                                     |
| `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_DB`                        | invent them here; nothing else uses them                                                                                       |
| `PAYLOAD_SECRET`                                                             | long random string. Changing it logs everyone out                                                                              |
| `CMS_IMAGE`                                                                  | optional; defaults to `ghcr.io/hyhng/sabrina-cms:latest`                                                                       |
| `SITE_URL`                                                                   | optional; where „Zobrazit web“ in the admin leads. Unset = `https://sabrina-web.pages.dev`; set it when the domain is switched |
| `R2_*`, `CF_DEPLOY_HOOK_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `IMG_BASE_URL` | optional. Without them the admin still runs and says which one a given feature is missing                                      |

`ADMIN_DOMAIN=localhost` runs the whole stack on a laptop with Caddy's own local
certificate, which is how all of this was tested.

## The database schema

Nothing to run. Payload applies `apps/cms/migrations/` itself when it first
connects in production, and skips them on later boots — `prodMigrations` in
`payload.config.ts`.

This matters because in production Payload does **not** push the schema the way
it does in development. Without the migrations a fresh server comes up against an
empty database and every page fails on `relation "users" does not exist`.

A schema change means a new migration, committed with the change:

```bash
pnpm --filter cms exec payload migrate:create <name>
```

The generated file needs two small edits to pass this repo's typecheck — a
type-only import and dropping the unused `payload`/`req` parameters. The SQL is
never edited once it has run anywhere.

## Updating the admin

The image is built by `.github/workflows/cms-image.yml` on merges to `main` and
pushed to `ghcr.io`. The server pulls; nothing pushes to the server, because a
deploy key able to reach it would have to live in a repo the client does not own.

```bash
cd /opt/sabrina && git pull        # for compose, Caddyfile, backup.sh
cd infra
docker compose -f docker-compose.prod.yml pull cms
docker compose -f docker-compose.prod.yml up -d cms
```

Rolling back: set `CMS_IMAGE=ghcr.io/hyhng/sabrina-cms:sha-<commit>` in `.env`
and run the same two commands. A migration is not rolled back by doing that —
check whether the version you are going back to predates one.

## Backups

```bash
crontab -e
0 3 * * *  /opt/sabrina/infra/backup.sh >> /var/log/sabrina-backup.log 2>&1
```

`backup.sh` dumps the database through its container, checks the dump gunzips
and is not suspiciously small, and removes anything older than 30 days. Dumps
are readable by root alone (`umask 077`).

**Off-server copy.** With `BACKUP_R2_BUCKET` set in `.env` it also uploads to
`r2://<that bucket>/backups/` and prunes the bucket. That must be a **private
bucket of its own, with no public access and no custom domain** — never the photo
bucket, which is public through `img.<domain>`, and a dump holds e-mail addresses
and password hashes. Use a token scoped to that bucket
(`BACKUP_R2_ACCESS_KEY_ID` / `BACKUP_R2_SECRET_ACCESS_KEY`); it falls back to the
photo keys only if that token happens to cover both. Unset, the dump stays on the
server and the log says so — which does not survive losing the server.

On the server since 7 October, with the copy in the private bucket `sabrina-backups` (token scoped to that bucket alone: it is denied on the photo bucket): cron at 03:00, log in `/var/log/sabrina-backup.log`
(rotated monthly), dumps in `/var/backups/sabrina`.

Photographs are not backed up: they are already in R2 and immutable. The
database is the only thing here that cannot be reconstructed.

### Restoring — rehearsed, not theoretical

Done on 1 October on a laptop, and on 7 October on the real server: a dump of the
live database restored into a throwaway `postgres:16` container, row counts
compared with the live database (1 user, 2 projects, 18 photos — equal), container
removed. The only errors were `role "sabrina" does not exist` — the dump assigns
table ownership to the application's role, which the throwaway container lacks;
harmless, and absent when restoring into the real stack.

```bash
cd /opt/sabrina/infra
gunzip -c /var/backups/sabrina/payload-<stamp>.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T db \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

The dump carries `--clean --if-exists`, so it drops what it is replacing. Doing
this against a live database replaces its contents — take a dump first.

Repeat it shortly before handover (docs/PHASES.md F6) and after any change to the
schema or the backup script.

## Still to do on the real server

- nothing that blocks use. Resend is live since 7 October: domain
  `sabrinakulhankova.photography` verified in Resend (SPF/DKIM CNAME and TXT
  records on `send.`, `rsend.`, `resend._domainkey.` and `_dmarc.`, all DNS only),
  key and `EMAIL_FROM` in `.env`. The Resend account is the developer's for now
  and must move to the client before handover (docs/PHASES.md F6).
