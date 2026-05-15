# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# better-sqlite3 needs native compilation
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Native deps for production install
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && apk del python3 make g++

COPY server ./server
COPY --from=build /app/dist ./dist

# SQLite & telegram data live here
RUN mkdir -p /data && chown -R node:node /data
USER node

EXPOSE 3001
CMD ["node", "server/index.js"]
