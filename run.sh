#!/bin/bash

echo "contents of image /"
ls -la /

echo "contents of image /app"
ls -la /app

echo "contents of image /app/.next"
ls -la /app/.next

# Start the Next.js application
echo "Starting the Next.js application..."
node server.js