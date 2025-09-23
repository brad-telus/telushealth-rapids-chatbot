#!/bin/bash

echo "contents of image /"
ls -la /

echo "contents of image /app"
ls -la /app

echo "contents of image /app/.next"
ls -la /app/.next

cd /app

echo "Running migrations..."
pnpm run db:migrate

# Start the Next.js application
echo "Starting chatbot application on port ${PORT:-8081}..."
exec node server.js
