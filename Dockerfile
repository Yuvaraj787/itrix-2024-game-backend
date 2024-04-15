# docker build -t muthupalaniyappanol/ista-website:0.17 .
# docker push muthupalaniyappanol/ista-website:0.17

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

ENV NODE_ENV production
ENV DATABASE_URL mongodb+srv://user:godamnpassword@cluster0.54xom2u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
ENV SMTP_SERVER smtp.hostinger.in
ENV EMAIL_ID admin@istaceg.in
ENV PASSWD heyThisisAdmin1-
ENV CURRENT_SERVER_IP istaceg.in
ENV NEXT_PUBLIC_DOMAIN_NAME istaceg.in
ENV SECRET_KEY 63208069818177361089324883782532
ENV NEXT_PUBLIC_CAPCHA_SITE_KEY 6Lc9HLspAAAAAEeiv-O77afc8UopufObtkGBfuBc
ENV CAPCHA_SECRET_KEY 6Lc9HLspAAAAAM_sbSQvTwsMgYHiAwxgAfRn5HlY
ENV NEXT_PUBLIC_OAUTH_CLIENT_ID 646137268332-j6g4okcld07e1hrsttvnd6f7jhushrdu.apps.googleusercontent.com
ENV OAUTH_CLIENT_SECRET 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

RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app


# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY .env.development .env.production

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js