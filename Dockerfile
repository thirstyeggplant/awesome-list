# The site, with its database built into the image from the public files of out/.
# Build after `pnpm build-data`:  docker build -t shelf .   Run:  docker run -p 8080:8080 -e SITE_ORIGIN=https://… shelf
FROM node:24-slim
ENV NODE_ENV=production PORT=8080 SITE_DB=/app/out/site.db
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY tsconfig.json ./
COPY src ./src
# Only the public files: never out/private/.
COPY out/lists.jsonl out/items.jsonl out/listings.jsonl out/run.json ./out/
RUN pnpm build-site && rm out/*.jsonl
USER node
EXPOSE 8080
CMD ["node_modules/.bin/tsx", "src/site/server.ts"]
