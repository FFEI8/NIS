#!/bin/bash
# Persistent server runner that restarts Next.js if it crashes
while true; do
    node node_modules/.bin/next dev -p 3000
    echo "[$(date)] Server crashed, restarting in 3s..." >> /home/z/my-project/server-crash.log
    sleep 3
done
