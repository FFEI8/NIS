#!/bin/bash
# Robust server runner with auto-restart
cd /home/z/my-project

# Kill any existing server
pkill -f "next" 2>/dev/null
pkill -f "standalone/server" 2>/dev/null
sleep 2
rm -f .next/lock

while true; do
  echo "[$(date)] Starting Next.js server..."
  
  # Use standalone build for lower memory
  PORT=3000 HOSTNAME=0.0.0.0 DATABASE_URL="file:/home/z/my-project/db/custom.db" \
    node .next/standalone/server.js 2>&1 | tee -a /home/z/my-project/dev.log
  
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
