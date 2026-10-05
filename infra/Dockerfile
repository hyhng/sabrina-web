# The admin (apps/cms) as an image for the server (docs/TECH.md 7).
#
# Built for linux/amd64 and linux/arm64 (the workflow does both). The plan is a
# Hetzner CAX11, which is arm64 — as is any Apple Silicon laptop, which is why
# this image was rehearsed locally before the server existed — but an x86 server
# runs the same tag. Nothing in here is architecture-specific: the base image is
# multi-arch and the native pieces (Next's SWC) are picked at install time.
#
# Debian slim rather than Alpine on purpose. Next ships separate SWC binaries
# for glibc and musl, and the glibc one is the better-trodden path; the image is
# a few tens of MB larger and nothing here is size-critical.
#
# The build context is the repo root, because a pnpm workspace cannot be
# installed from inside one of its packages.

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Non-interactive: corepack otherwise stops to ask before downloading pnpm.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo


# --- dependencies -----------------------------------------------------------
# Only the manifests first, so a source change does not reinstall everything.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cms/package.json apps/cms/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile


# --- build ------------------------------------------------------------------
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# Payload reads the config at build time but never reaches the database, so a
# placeholder is enough here. The real values arrive as environment variables
# when the container runs — nothing secret is baked into the image
# (CLAUDE.md rule 11).
ENV DATABASE_URI=postgres://build:build@127.0.0.1:5432/build
ENV PAYLOAD_SECRET=build-only-not-a-secret
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter cms build


# --- runtime ----------------------------------------------------------------
FROM node:24-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /repo

# Not root: the admin is reachable from the internet.
RUN groupadd --system --gid 1001 payload \
 && useradd --system --uid 1001 --gid payload payload

# `standalone` already carries the workspace layout and only the files the
# server traced as needed; static assets and the admin's own files are not
# traced and have to come across separately.
COPY --from=build --chown=payload:payload /repo/apps/cms/.next/standalone ./
COPY --from=build --chown=payload:payload /repo/apps/cms/.next/static ./apps/cms/.next/static

USER payload
EXPOSE 3001

# Caddy terminates TLS in front of this; the container itself speaks plain HTTP.
CMD ["node", "apps/cms/server.js"]
