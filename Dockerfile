# ---------- Base (dependencies only)
FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# choose one:
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i --legacy-peer-deps; fi

# ---------- Builder (compile TS)
FROM base AS builder
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build  # expects to output to ./dist

# ---------- Runtime (small image)
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# system tz/ca-certificates optional
RUN apk add --no-cache tini
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .
# COPY .env ./.env  # optional; you can also provide env via compose
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/main.js"]
EXPOSE 3001