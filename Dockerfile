FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["node", "server.js"]
