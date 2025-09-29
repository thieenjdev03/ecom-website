#!/bin/bash

# Kill any process using port 3000
echo "Stopping any process on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start the development server
echo "Starting development server..."
npm run start:dev
