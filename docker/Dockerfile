FROM node:26-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY packages/server/package.json packages/server/package.json
RUN npm install --workspace packages/server --omit=dev

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "src/index.js"]
