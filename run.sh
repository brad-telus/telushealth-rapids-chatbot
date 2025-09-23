#!/bin/bash

# Lacework agent: start the agent in the background
if [ -f /var/lib/lacework/datacollector ]; then
    echo "Starting Lacework agent..."
    /var/lib/lacework/datacollector &
else
    echo "Warning: Lacework datacollector not found"
fi

cd /app

echo "Running migrations..."
pnpm run db:migrate

# Start the Next.js application
echo "Starting chatbot application on port ${PORT:-8081}..."
exec node server.js