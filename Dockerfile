# Self-hosted image: builds the app and serves it on workerd (Cloudflare's open-source Workers runtime)
# with D1 (SQLite) and R2 (files) stored under /data. workerd needs glibc, so no Alpine.
FROM node:22-bookworm-slim
WORKDIR /app
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 SITES_PNPM_SHARED_STORE=/pnpm/store
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production STATE_DIR=/data/state
EXPOSE 8787
VOLUME ["/data"]
CMD ["./deploy/start.sh"]
