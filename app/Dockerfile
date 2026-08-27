# Multi-stage build — compiles the SPA with Node, then ships only the static
# output on a tiny web server. No Node in the runtime image.
#
# The sibling services both serve static files from a compiled Go binary, but
# neither needs SPA fallback (they are multi-page sites). Caddy gives that in
# one directive rather than a new Go program to maintain here.
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so the dependency layer is cached and only reinstalls
# when the lockfile actually changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
