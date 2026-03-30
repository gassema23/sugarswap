FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist     ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3001

# Run pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
