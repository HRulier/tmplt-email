FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Dummy build-time env vars — overridden at runtime via env_file
ENV BETTER_AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3002
ENV BETTER_AUTH_SECRET=build_placeholder_not_used_at_runtime
ENV MONGODB_URI=mongodb://localhost:27017/placeholder
ENV API_KEY_ENCRYPTION_SECRET=0000000000000000000000000000000000000000000000000000000000000000
ENV ANTHROPIC_API_KEY=build_placeholder
ENV RESEND_API_KEY=build_placeholder
ENV RESEND_FROM_EMAIL=build@placeholder.com

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
