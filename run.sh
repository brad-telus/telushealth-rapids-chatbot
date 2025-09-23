#!/bin/bash

echo "current dir: "
pwd

echo "contents of image /"
ls -la /

echo "contents of image /app"
ls -la /app

echo "contents of image /app/.next"
ls -la /app/.next

# Run database migrations
echo "Running database migrations..."
cd /app/lib/db && npx tsx migrate.ts

cd /app

# Start the Next.js application
echo "Starting the Next.js application..."
node server.js