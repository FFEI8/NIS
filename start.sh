#!/bin/bash
# Auto-restart supervisor for the dev server
# Keeps the server running by restarting when it crashes

echo "[supervisor] Starting dev server supervisor..."

while true; do
  echo "[supervisor] Starting Next.js dev server..."
  cd /home/z/my-project
  
  # Clean stale cache if needed
  if [ -f .next/lock ]; then
    rm -f .next/lock
  fi
  
  # Start the server
  node node_modules/next/dist/bin/next dev -p 3000 --turbopack 2>&1 &
  SERVER_PID=$!
  
  echo "[supervisor] Server PID: $SERVER_PID"
  
  # Wait for server to be ready
  for i in $(seq 1 30); do
    if curl -s http://localhost:3000/ --max-time 2 -o /dev/null 2>/dev/null; then
      echo "[supervisor] Server is ready!"
      break
    fi
    sleep 1
  done
  
  # Monitor the server
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 5
  done
  
  EXIT_CODE=$?
  echo "[supervisor] Server exited with code $EXIT_CODE. Restarting in 3 seconds..."
  sleep 3
  
  # Clean up
  pkill -f "next-server" 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  sleep 2
done
