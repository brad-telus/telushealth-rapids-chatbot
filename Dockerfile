# Documentation can be found on https://cloud-run.netlify.app/onboarding/install-with-cloud-run/#step-1-embed-agent-in-application-container-image
# LaceWork@2023

# Lacework agent: adding a build stage
FROM lacework/datacollector:7.1.4 AS agent-build-image

# Find and copy the datacollector to a known directory
# This is needed because the datacollector binary is not in the PATH and its path also changed between v7.1.4 and 7.2.0
RUN mkdir -p /opt/lacework && cp $(find /var/lib/ -name datacollector | head -n 1) /opt/lacework/datacollector

FROM ubuntu:latest as lw-agent-provider
COPY --from=agent-build-image /opt/lacework/datacollector /var/lib/lacework/datacollector
RUN chmod +x /var/lib/lacework/datacollector

FROM node:24.3.0
RUN apt-get update && apt-get install -y \
ca-certificates \
&& rm -rf /var/lib/apt/lists/*

# Lacework agent: copying the agent binary
COPY --from=lw-agent-provider /var/lib/lacework/datacollector /var/lib/lacework/datacollector

WORKDIR /app

ENV TZ="America/Montreal"
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy public files
COPY public ./public

COPY .next/standalone ./
COPY .next/standalone ./.next/standalone
COPY .next/static ./.next/static
COPY public ./.next/standalone/public
COPY .next/static ./.next/standalone/.next/static
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED=0
ENV PORT=8081
ENV AUTH_TRUST_HOST=true

ENTRYPOINT ["/run.sh"]